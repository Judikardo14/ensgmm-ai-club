-- ============================================================================
-- Rentrée : remise à zéro des scores, avec sauvegarde. À lancer le jour J.
-- Rien n'est supprimé : les soumissions de la saison passée sont ARCHIVÉES
-- (archived = true) et le classement final est copié dans une table de sauvegarde.
-- ============================================================================

-- 1) Sauvegarde du classement final de la saison.
create table if not exists public.saison_2026_classement as
select id as user_id, full_name, email, filiere, promo, role, total_points, now() as sauvegarde_le
  from public.profiles;
alter table public.saison_2026_classement enable row level security;  -- aucune policy : lecture admin via SQL Editor seulement

-- 2) Sauvegarde des soumissions de la saison (copie complète).
create table if not exists public.saison_2026_soumissions as
select * from public.submissions;
alter table public.saison_2026_soumissions enable row level security;

-- 3) Archivage des soumissions : elles ne comptent plus dans les points
--    (recalculate_points ignore les lignes archived = true).
update public.submissions set archived = true where archived = false;

-- 4) Remise à zéro des compteurs (admins compris).
update public.profiles set total_points = 0;

-- 5) Contrôle : tout doit être à 0.
select count(*) as profils, count(*) filter (where total_points <> 0) as non_zero from public.profiles;

-- À faire ensuite dans l'appli admin : clôturer les anciens devoirs et compétitions
-- (leur statut est encore "open" / "active"), puis créer ceux de la nouvelle saison.
-- Les comptes bannis et la liste banned_emails ne sont PAS modifiés.
