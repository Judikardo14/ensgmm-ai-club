-- ============================================================================
-- Maintenance de sécurité (rentrée 2026)
-- À coller dans le SQL Editor de Supabase. Aucune donnée n'est supprimée.
-- ============================================================================

-- 1) FAILLE : n'importe quel utilisateur connecté pouvait modifier SON PROPRE profil
--    sans restriction de colonne, donc se donner le rôle admin, des points, ou se
--    débannir. Ce déclencheur refuse la modification de role / total_points / banned /
--    ban_reason / email par un non-admin.
--    Il reste SECURITY INVOKER : les fonctions internes (recalcul des points, exécutées
--    avec les droits du propriétaire) ne sont pas bloquées.
create or replace function public.proteger_profil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
     and (   new.role         is distinct from old.role
          or new.total_points is distinct from old.total_points
          or new.banned       is distinct from old.banned
          or new.ban_reason   is distinct from old.ban_reason
          or new.email        is distinct from old.email)
  then
    raise exception 'Modification non autorisée de ces champs du profil';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_profil_trigger on public.profiles;
create trigger proteger_profil_trigger
  before update on public.profiles
  for each row execute function public.proteger_profil();

-- 2) FUITE : la vue activity_feed (soumissions, notes et commentaires de tous les membres)
--    était lisible par n'importe qui avec la clé publique, sans connexion.
--    La fonction get_my_activity_feed() (utilisée par le tableau de bord) continue de
--    fonctionner : elle s'exécute avec les droits du propriétaire.
revoke all on public.activity_feed from anon, authenticated;

-- 3) Fonctions internes (déclencheurs) : inutile de les exposer comme API publique.
revoke execute on function public.handle_new_user()            from anon, authenticated;
revoke execute on function public.notify_graded()              from anon, authenticated;
revoke execute on function public.notify_new_assignment()      from anon, authenticated;
revoke execute on function public.notify_new_competition()     from anon, authenticated;
revoke execute on function public.on_competition_scored()      from anon, authenticated;
revoke execute on function public.on_submission_graded()       from anon, authenticated;
revoke execute on function public.trigger_recalculate_points() from anon, authenticated;
revoke execute on function public.rls_auto_enable()            from anon, authenticated;
revoke execute on function public.get_my_activity_feed()       from anon;
-- recalculate_points reste appelable par les utilisateurs connectés : l'appli l'utilise.
revoke execute on function public.recalculate_points(uuid)     from anon;

-- 4) Chemin de recherche fixé pour les fonctions signalées par Supabase.
alter function public.recalculate_points(uuid)     set search_path = public;
alter function public.trigger_recalculate_points() set search_path = public;
alter function public.on_submission_graded()       set search_path = public;
alter function public.on_competition_scored()      set search_path = public;
alter function public.notify_graded()              set search_path = public;
alter function public.notify_new_assignment()      set search_path = public;
alter function public.notify_new_competition()     set search_path = public;
alter function public.handle_new_user()            set search_path = public;
alter function public.increment_submission_count() set search_path = public;
alter function public.get_my_activity_feed()       set search_path = public;
