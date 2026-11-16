-- ============================================================================
-- AICE : fonction plus rapide et limitation moins agressive
-- À coller dans le SQL Editor de Supabase (après aice_resultats_phase2.sql).
--  - on ne compte plus que les essais ÉCHOUÉS (un résultat trouvé ne consomme rien)
--  - plafond par e-mail : 8 échecs / 10 min ; par IP : 40 échecs / 10 min
--    (les réseaux mobiles partagent souvent la même IP entre plusieurs candidats)
--  - plus de DELETE à chaque appel : nettoyage occasionnel (1 appel sur 50)
-- ============================================================================
create index if not exists aice_tentatives_date_idx on public.aice_tentatives (cree_le);

create or replace function public.verifier_resultat_aice(p_email text, p_whatsapp4 text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_courriel    text := lower(trim(coalesce(p_email, '')));
  v_chiffres    text := right(regexp_replace(coalesce(p_whatsapp4, ''), '\D', '', 'g'), 4);
  v_publie      boolean;
  v_lien        text;
  v_entetes     text;
  v_ip          text;
  v_nb_ip       int;
  v_nb_courriel int;
  v_ligne       public.aice_resultats%rowtype;
begin
  select publie, lien_whatsapp into v_publie, v_lien from public.aice_config where id = 1;
  if not coalesce(v_publie, false) then
    return jsonb_build_object('etat', 'ferme');
  end if;

  v_entetes := current_setting('request.headers', true);
  v_ip := coalesce(split_part(nullif(v_entetes, '')::json ->> 'x-forwarded-for', ',', 1), 'inconnue');

  if random() < 0.02 then
    delete from public.aice_tentatives where cree_le < now() - interval '1 day';
  end if;

  select count(*) into v_nb_ip
    from public.aice_tentatives
   where cle = 'ip:' || v_ip and cree_le > now() - interval '10 minutes';
  select count(*) into v_nb_courriel
    from public.aice_tentatives
   where cle = 'mail:' || v_courriel and cree_le > now() - interval '10 minutes';

  if v_nb_ip >= 40 or v_nb_courriel >= 8 then
    return jsonb_build_object('etat', 'trop_de_tentatives');
  end if;

  if length(v_courriel) >= 5 and length(v_chiffres) = 4 then
    select * into v_ligne
      from public.aice_resultats
     where email_norm = v_courriel and whatsapp4 = v_chiffres;
  end if;

  if v_ligne.email_norm is null then
    insert into public.aice_tentatives (cle) values ('ip:' || v_ip), ('mail:' || v_courriel);
    return jsonb_build_object('etat', 'introuvable');
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
    'lien_whatsapp',     case when v_ligne.statut = 'Retenu' then nullif(v_lien, '') else null end
  );
end;
$$;

revoke all on function public.verifier_resultat_aice(text, text) from public;
grant execute on function public.verifier_resultat_aice(text, text) to anon, authenticated;
