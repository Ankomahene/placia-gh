-- Category synonyms name kinds of place, never places. A synonym is written into the search text
-- of every place in its category, so "knust" and "ucc" as university synonyms made every college
-- match them, and "legon", "makola", "ada" could not be read as towns. Landmarks are found by
-- their own names, initials and town mentions instead.
update public.categories c
   set synonyms = array(
         select s from unnest(c.synonyms) s
          where s not in ('legon', 'knust', 'ucc', 'makola', 'kejetia', 'kotoka', 'kia',
                          'labadi', 'kokrobite', 'ada'))
 where c.slug in ('university', 'market', 'airport', 'beach');

-- Rebuild the search text of the places in those categories (the trigger fires on category_id).
update public.places
   set category_id = category_id
 where category_id in (select id from public.categories
                        where slug in ('university', 'market', 'airport', 'beach'));
