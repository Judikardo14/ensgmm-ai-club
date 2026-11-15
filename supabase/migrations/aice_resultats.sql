-- ============================================================================
-- Résultats de sélection AICE : page publique de consultation
-- À coller dans le SQL Editor de Supabase (pas dans l'UI "Functions").
-- ============================================================================

-- 1) Table des résultats. RLS activée SANS aucune policy : personne ne peut
--    lire la table directement avec la clé anon. Seule la fonction ci-dessous y accède.
create table if not exists public.aice_resultats (
  email_norm text primary key,           -- e-mail en minuscules, sans espaces
  nom        text not null default '',
  whatsapp4  text not null default '',   -- 4 derniers chiffres du WhatsApp
  statut     text not null,              -- Retenu / Liste d'attente / Non retenu / ...
  motif      text not null default '',   -- texte affiché au candidat
  cree_le    timestamptz not null default now()
);
alter table public.aice_resultats enable row level security;

-- 2) Interrupteur de publication : la page reste fermée tant que publie = false.
create table if not exists public.aice_config (
  id     int primary key default 1 check (id = 1),
  publie boolean not null default false
);
insert into public.aice_config (id, publie) values (1, false) on conflict (id) do nothing;
alter table public.aice_config enable row level security;

-- 3) Journal des tentatives pour limiter les essais en masse.
create table if not exists public.aice_tentatives (
  id      bigserial primary key,
  cle     text not null,
  cree_le timestamptz not null default now()
);
create index if not exists aice_tentatives_cle_idx on public.aice_tentatives (cle, cree_le);
alter table public.aice_tentatives enable row level security;

-- 4) Fonction appelée par la page : e-mail + 4 derniers chiffres du WhatsApp.
--    Elle ne renvoie jamais plus d'une ligne et ne dit pas si l'e-mail existe
--    quand le deuxième facteur est faux.
create or replace function public.verifier_resultat_aice(p_email text, p_whatsapp4 text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courriel   text := lower(trim(coalesce(p_email, '')));
  v_chiffres   text := right(regexp_replace(coalesce(p_whatsapp4, ''), '\D', '', 'g'), 4);
  v_publie     boolean;
  v_entetes    text;
  v_ip         text;
  v_nb_ip      int;
  v_nb_courriel int;
  v_ligne      public.aice_resultats%rowtype;
begin
  select publie into v_publie from public.aice_config where id = 1;
  if not coalesce(v_publie, false) then
    return jsonb_build_object('etat', 'ferme');
  end if;

  -- Limitation : 15 essais / 10 min par IP, 8 essais / 10 min par e-mail
  v_entetes := current_setting('request.headers', true);
  v_ip := coalesce(split_part(nullif(v_entetes, '')::json ->> 'x-forwarded-for', ',', 1), 'inconnue');

  delete from public.aice_tentatives where cree_le < now() - interval '1 day';

  select count(*) into v_nb_ip
    from public.aice_tentatives
   where cle = 'ip:' || v_ip and cree_le > now() - interval '10 minutes';
  select count(*) into v_nb_courriel
    from public.aice_tentatives
   where cle = 'mail:' || v_courriel and cree_le > now() - interval '10 minutes';

  if v_nb_ip >= 15 or v_nb_courriel >= 8 then
    return jsonb_build_object('etat', 'trop_de_tentatives');
  end if;

  insert into public.aice_tentatives (cle) values ('ip:' || v_ip), ('mail:' || v_courriel);

  if length(v_courriel) < 5 or length(v_chiffres) < 4 then
    return jsonb_build_object('etat', 'introuvable');
  end if;

  select * into v_ligne
    from public.aice_resultats
   where email_norm = v_courriel and whatsapp4 = v_chiffres;

  if not found then
    return jsonb_build_object('etat', 'introuvable');
  end if;

  return jsonb_build_object(
    'etat',   'ok',
    'nom',    v_ligne.nom,
    'statut', v_ligne.statut,
    'motif',  v_ligne.motif
  );
end;
$$;

revoke all on function public.verifier_resultat_aice(text, text) from public;
grant execute on function public.verifier_resultat_aice(text, text) to anon, authenticated;

-- ============================================================================
-- APRÈS l'import du CSV (Table Editor → aice_resultats → Import) et ta relecture :
--   update public.aice_config set publie = true  where id = 1;   -- ouvrir
--   update public.aice_config set publie = false where id = 1;   -- refermer
-- ============================================================================
