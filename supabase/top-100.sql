-- SQL Editor'e sadece bu dosyayi yapistir. schema.sql dosyasini tekrar calistirma.
-- Toplam XP bir kolon degil: 11 body_part_stats satiri toplanir.
-- Gecmis tablosu yok. Yalnizca public profiller. En fazla 100 satir.

create or replace function public.get_top_100(p_limit integer default 100)
returns table (
  "rank" integer,
  username text,
  total_xp integer,
  current_streak integer
)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      p.username as board_username,
      sum(b.total_xp)::integer as board_xp,
      s.current_streak as board_streak
    from public.profiles p
    join public.user_stats s on s.user_id = p.id
    join public.body_part_stats b on b.user_id = p.id
    where p.profile_visibility = 'public'
    group by p.id, p.username, s.current_streak
    having sum(b.total_xp) > 0
  )
  select
    row_number() over (
      order by scored.board_xp desc, scored.board_username asc
    )::integer as "rank",
    scored.board_username as username,
    scored.board_xp as total_xp,
    scored.board_streak as current_streak
  from scored
  order by scored.board_xp desc, scored.board_username asc
  limit (
    case
      when p_limit is null or p_limit < 1 or p_limit > 100 then 100
      else p_limit
    end
  );
$$;

comment on function public.get_top_100(integer) is
  'Public Top 100 by sum of body_part_stats.total_xp. No history table.';

revoke all on function public.get_top_100(integer) from public, anon, authenticated;
grant execute on function public.get_top_100(integer) to authenticated;

notify pgrst, 'reload schema';
