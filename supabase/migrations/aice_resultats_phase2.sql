-- ============================================================================
-- AICE phase 2 : lien WhatsApp pour les retenus, sans appréciation de l'IA
-- À coller dans le SQL Editor APRÈS aice_resultats.sql (aice_resultats_scores.sql devient inutile).
-- ============================================================================

-- 0) Colonnes de score (sans effet si aice_resultats_scores.sql a déjà été exécuté).
--    Ce fichier suffit donc à lui seul, après aice_resultats.sql.
alter table public.aice_resultats
  add column if not exists score             int,
  add column if not exists pts_motivation    int,
  add column if not exists pts_valeur        int,
  add column if not exists pts_serieux       int,
  add column if not exists pts_preoccupation int;

-- 1) Le lien du groupe vit dans la config (aucune lecture publique) et n'est
--    renvoyé par la fonction qu'aux candidats dont le statut est 'Retenu'.
alter table public.aice_config
  add column if not exists lien_whatsapp text not null default '';

-- 2) Fonction mise à jour : plus d'appréciation, ajout du lien.
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
  v_lien       text;
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

  -- Le lien du groupe WhatsApp n'est renvoyé qu'aux candidats retenus
  if v_ligne.statut = 'Retenu' then
    select lien_whatsapp into v_lien from public.aice_config where id = 1;
  end if;

  return jsonb_build_object(
    'etat',              'ok',
    'nom',               v_ligne.nom,
    'statut',            v_ligne.statut,
    'motif',             v_ligne.motif,
    'score',             v_ligne.score,
    'pts_motivation',    v_ligne.pts_motivation,
    'pts_valeur',        v_ligne.pts_valeur,
    'pts_serieux',       v_ligne.pts_serieux,
    'pts_preoccupation', v_ligne.pts_preoccupation,
    'lien_whatsapp',     nullif(v_lien, '')
  );
end;
$$;

revoke all on function public.verifier_resultat_aice(text, text) from public;
grant execute on function public.verifier_resultat_aice(text, text) to anon, authenticated;

-- 3) L'appréciation écrite par l'IA ne doit plus être stockée dans la base publique.
alter table public.aice_resultats drop column if exists appreciation;

-- 4) Les statuts changent (42 premiers retenus, sans seuil) : on repart d'une table vide,
--    puis on réimporte le nouveau resultats_publics_AICE.csv.
truncate table public.aice_resultats;

-- ============================================================================
-- Enregistrer le lien du groupe (à faire une fois, avec TON vrai lien) :
--   update public.aice_config
--      set lien_whatsapp = 'https://chat.whatsapp.com/XXXXXXXXXXXXXXXX'
--    where id = 1;
-- ============================================================================
