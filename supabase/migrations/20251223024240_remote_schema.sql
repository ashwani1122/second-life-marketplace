create extension if not exists "http" with schema "public";

drop trigger if exists "update_products_updated_at" on "public"."products";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop policy "Product owners can manage their images" on "public"."product_images";

alter table "public"."categories" drop constraint "categories_parent_id_fkey";

alter table "public"."product_images" drop constraint "product_images_product_id_fkey";

alter table "public"."products" drop constraint "products_category_id_fkey";


  create table "public"."bookings" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "buyer_id" uuid not null,
    "seller_id" uuid not null,
    "status" text not null default 'pending'::text,
    "offered_price" numeric,
    "message" text,
    "preferred_date" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "confirmed_at" timestamp with time zone,
    "cancelled_by" text,
    "metadata" jsonb
      );



  create table "public"."chat_typing" (
    "chat_id" uuid not null,
    "user_id" uuid not null,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."chats" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid,
    "seller_id" uuid,
    "buyer_id" uuid,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "chat_id" uuid,
    "sender_id" uuid not null,
    "content" text,
    "attachment_url" text,
    "read" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "actor_id" uuid,
    "type" text not null,
    "payload" jsonb,
    "read" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "title" text,
    "body" text,
    "data" jsonb,
    "sms_sent" boolean default false,
    "sms_sid" text,
    "sms_error" text,
    "sms_sent_at" timestamp with time zone,
    "sms_status" text
      );


alter table "public"."products" add column "image_url" text;

alter table "public"."products" add column "latitude" double precision;

alter table "public"."products" add column "longitude" double precision;

alter table "public"."profiles" add column "email_notifications_enabled" boolean not null default true;

alter table "public"."profiles" add column "notification_email" text;

alter table "public"."profiles" add column "push_notifications_enabled" boolean not null default false;

alter table "public"."profiles" add column "sms_notifications_enabled" boolean not null default true;

alter table "public"."profiles" add column "whatsapp_notifications_enabled" boolean not null default false;

alter table "public"."profiles" add column "whatsapp_number" text;

CREATE UNIQUE INDEX bookings_one_accepted_per_product ON public.bookings USING btree (product_id) WHERE (status = 'accepted'::text);

CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);

CREATE UNIQUE INDEX chat_typing_pkey ON public.chat_typing USING btree (chat_id, user_id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE INDEX idx_products_lat_lng ON public.products USING btree (latitude, longitude);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

alter table "public"."bookings" add constraint "bookings_pkey" PRIMARY KEY using index "bookings_pkey";

alter table "public"."chat_typing" add constraint "chat_typing_pkey" PRIMARY KEY using index "chat_typing_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."bookings" add constraint "bookings_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_buyer_id_fkey";

alter table "public"."bookings" add constraint "bookings_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_product_id_fkey";

alter table "public"."bookings" add constraint "bookings_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."bookings" validate constraint "bookings_seller_id_fkey";

alter table "public"."bookings" add constraint "bookings_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text, 'expired'::text]))) not valid;

alter table "public"."bookings" validate constraint "bookings_status_check";

alter table "public"."bookings" add constraint "fk_bookings_buyer" FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."bookings" validate constraint "fk_bookings_buyer";

alter table "public"."bookings" add constraint "fk_bookings_seller" FOREIGN KEY (seller_id) REFERENCES public.profiles(id) not valid;

alter table "public"."bookings" validate constraint "fk_bookings_seller";

alter table "public"."chat_typing" add constraint "chat_typing_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_typing" validate constraint "chat_typing_chat_id_fkey";

alter table "public"."chats" add constraint "fk_buyer_profile" FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."chats" validate constraint "fk_buyer_profile";

alter table "public"."chats" add constraint "fk_product_id" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."chats" validate constraint "fk_product_id";

alter table "public"."chats" add constraint "fk_seller_profile" FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."chats" validate constraint "fk_seller_profile";

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_chat_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_parent_id_fkey";

alter table "public"."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_images" validate constraint "product_images_product_id_fkey";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.bookings_notify_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  payload jsonb;
begin
  payload := jsonb_build_object('booking_id', new.id, 'product_id', new.product_id, 'message', new.message, 'offered_price', new.offered_price);

  insert into public.notifications (user_id, actor_id, type, payload)
  values (new.seller_id, new.buyer_id, 'booking_request', payload);

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.finalize_sale_rpc(p_booking_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_product_id uuid;
  v_seller_id uuid;
  v_booking_rec record;
  v_bookings record;
  v_product_title text;
begin
  -- load booking + product and lock
  select b.id as booking_id, b.product_id, p.seller_id, p.title
    into v_booking_rec
  from public.bookings b
  join public.products p on p.id = b.product_id
  where b.id = p_booking_id
  for update;

  if v_booking_rec.booking_id is null then
    return jsonb_build_object('status','error','message','booking not found');
  end if;

  v_product_id := v_booking_rec.product_id;
  v_seller_id := v_booking_rec.seller_id;
  v_product_title := v_booking_rec.title;

  -- AUTH check: cast both sides to text to avoid type mismatch
  if auth.uid() is null or auth.uid()::text <> v_seller_id::text then
    return jsonb_build_object('status','error','message','forbidden: only seller can finalize');
  end if;

  -- accept chosen booking
  update public.bookings
  set status = 'accepted', updated_at = now()
  where id = p_booking_id;

  -- reject other pending bookings
  update public.bookings
  set status = 'rejected', updated_at = now()
  where product_id = v_product_id
    and id <> p_booking_id
    and status = 'pending';

  -- mark product sold
  update public.products
  set status = 'sold', updated_at = now()
  where id = v_product_id;

  -- insert notifications for all affected buyers
  for v_bookings in
    select id, buyer_id, status
    from public.bookings
    where product_id = v_product_id
  loop
    if v_bookings.buyer_id is null then
      continue;
    end if;

    if v_bookings.id = p_booking_id then
      -- accepted buyer: type 'sale'
      insert into public.notifications (user_id, type, title, body, data, created_at)
      values (
        v_bookings.buyer_id,
        'sale',
        'Sale confirmed',
        format('Your booking for "%s" has been confirmed by the seller.', coalesce(v_product_title, (select title from public.products where id = v_product_id))),
        jsonb_build_object('booking_id', v_bookings.id::text, 'product_id', v_product_id::text, 'status', v_bookings.status),
        now()
      );
    else
      -- rejected buyer: type 'booking_update'
      insert into public.notifications (user_id, type, title, body, data, created_at)
      values (
        v_bookings.buyer_id,
        'booking_update',
        'Booking update',
        format('Your booking for "%s" was not selected.', coalesce(v_product_title, (select title from public.products where id = v_product_id))),
        jsonb_build_object('booking_id', v_bookings.id::text, 'product_id', v_product_id::text, 'status', v_bookings.status),
        now()
      );
    end if;
  end loop;

  return jsonb_build_object('status','ok','product_id', v_product_id::text, 'accepted_booking', p_booking_id::text);
exception
  when others then
    return jsonb_build_object('status','error','message', sqlerrm);
end;
$function$
;

create type "public"."http_header" as ("field" character varying, "value" character varying);

create type "public"."http_request" as ("method" public.http_method, "uri" character varying, "headers" public.http_header[], "content_type" character varying, "content" character varying);

create type "public"."http_response" as ("status" integer, "content_type" character varying, "headers" public.http_header[], "content" character varying);

CREATE OR REPLACE FUNCTION public.notify_on_booking_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  buyer uuid;
  product_title text;
begin
  if (TG_OP = 'UPDATE') then
    if (NEW.status = 'accepted' and OLD.status IS DISTINCT FROM NEW.status) then
      buyer := NEW.buyer_id;
      select title into product_title from public.products where id = NEW.product_id;
      if buyer is not null then
        insert into public.notifications (user_id, actor_id, type, title, body, payload, created_at)
        values (
          buyer,
          NEW.seller_id,
          'booking_accepted',
          'Booking accepted',
          concat('Your booking for "', coalesce(product_title, 'the product'), '" was accepted.'),
          jsonb_build_object('booking_id', NEW.id, 'product_id', NEW.product_id, 'status', 'accepted'),
          now()
        );
      end if;
    end if;
  end if;

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_booking_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  prod_owner uuid;
  product_title text;
begin
  select seller_id, title into prod_owner, product_title
  from public.products
  where id = NEW.product_id;

  if prod_owner is null then
    return NEW;
  end if;

  insert into public.notifications (user_id, actor_id, type, title, body, payload, created_at)
  values (
    prod_owner,
    NEW.buyer_id,
    'booking_request',
    'New booking request',
    concat('You have a new booking request for "', coalesce(product_title, 'your product'), '"'),
    jsonb_build_object('booking_id', NEW.id, 'product_id', NEW.product_id, 'offered_price', NEW.offered_price),
    now()
  );

  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.on_booking_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if (new.status = 'accepted') then
    update public.bookings
    set status = 'rejected', updated_at = now()
    where product_id = new.product_id and id <> new.id and status = 'pending';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.products_nearby(p_lat double precision, p_lng double precision, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_radius_meters integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, title text, price numeric, status text, latitude double precision, longitude double precision, distance_meters double precision)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH bbox AS (
    SELECT
      p_lat AS lat,
      p_lng AS lng,
      p_radius_meters AS radius_m,
      (p_radius_meters::double precision / 111000.0) AS delta_lat,
      (p_radius_meters::double precision / (111000.0 * cos(radians(p_lat)))) AS delta_lng
  )

  SELECT
    p.id,
    p.title,
    p.price,
    p.status,
    p.latitude,
    p.longitude,
    (
      6371000 * 2 * asin(
        sqrt(
          pow(sin(radians((p.latitude - bbox.lat) / 2)), 2) +
          cos(radians(bbox.lat)) * cos(radians(p.latitude)) *
          pow(sin(radians((p.longitude - bbox.lng) / 2)), 2)
        )
      )
    ) AS distance_meters
  FROM public.products p
  CROSS JOIN bbox
  WHERE p.status = 'active'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      p_radius_meters IS NULL
      OR (
        p.latitude BETWEEN (bbox.lat - bbox.delta_lat) AND (bbox.lat + bbox.delta_lat)
        AND p.longitude BETWEEN (bbox.lng - bbox.delta_lng) AND (bbox.lng + bbox.delta_lng)
      )
    )
  ORDER BY distance_meters
  LIMIT p_limit OFFSET p_offset;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.seller_accept_booking(p_booking_id uuid, p_seller_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_product_id uuid;
begin
  -- lock the chosen booking row, ensure it belongs to this seller
  select product_id into v_product_id
  from bookings
  where id = p_booking_id
    and seller_id = p_seller_id
  for update;

  if v_product_id is null then
    raise exception 'Booking not found or not owned by seller'
      using errcode = 'P0001';
  end if;

  -- reject all other pending bookings for that product
  update bookings
  set status = 'rejected',
      updated_at = now()
  where product_id = v_product_id
    and status = 'pending'
    and id <> p_booking_id;

  -- accept the selected booking
  update bookings
  set status = 'accepted',
      updated_at = now()
  where id = p_booking_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."bookings" to "anon";

grant insert on table "public"."bookings" to "anon";

grant references on table "public"."bookings" to "anon";

grant select on table "public"."bookings" to "anon";

grant trigger on table "public"."bookings" to "anon";

grant truncate on table "public"."bookings" to "anon";

grant update on table "public"."bookings" to "anon";

grant delete on table "public"."bookings" to "authenticated";

grant insert on table "public"."bookings" to "authenticated";

grant references on table "public"."bookings" to "authenticated";

grant select on table "public"."bookings" to "authenticated";

grant trigger on table "public"."bookings" to "authenticated";

grant truncate on table "public"."bookings" to "authenticated";

grant update on table "public"."bookings" to "authenticated";

grant delete on table "public"."bookings" to "service_role";

grant insert on table "public"."bookings" to "service_role";

grant references on table "public"."bookings" to "service_role";

grant select on table "public"."bookings" to "service_role";

grant trigger on table "public"."bookings" to "service_role";

grant truncate on table "public"."bookings" to "service_role";

grant update on table "public"."bookings" to "service_role";

grant delete on table "public"."chat_typing" to "anon";

grant insert on table "public"."chat_typing" to "anon";

grant references on table "public"."chat_typing" to "anon";

grant select on table "public"."chat_typing" to "anon";

grant trigger on table "public"."chat_typing" to "anon";

grant truncate on table "public"."chat_typing" to "anon";

grant update on table "public"."chat_typing" to "anon";

grant delete on table "public"."chat_typing" to "authenticated";

grant insert on table "public"."chat_typing" to "authenticated";

grant references on table "public"."chat_typing" to "authenticated";

grant select on table "public"."chat_typing" to "authenticated";

grant trigger on table "public"."chat_typing" to "authenticated";

grant truncate on table "public"."chat_typing" to "authenticated";

grant update on table "public"."chat_typing" to "authenticated";

grant delete on table "public"."chat_typing" to "service_role";

grant insert on table "public"."chat_typing" to "service_role";

grant references on table "public"."chat_typing" to "service_role";

grant select on table "public"."chat_typing" to "service_role";

grant trigger on table "public"."chat_typing" to "service_role";

grant truncate on table "public"."chat_typing" to "service_role";

grant update on table "public"."chat_typing" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";


  create policy "bookings_insert_by_buyer"
  on "public"."bookings"
  as permissive
  for insert
  to public
with check ((buyer_id = auth.uid()));



  create policy "bookings_select_buyer"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((buyer_id = auth.uid()));



  create policy "bookings_select_seller"
  on "public"."bookings"
  as permissive
  for select
  to public
using ((seller_id = auth.uid()));



  create policy "bookings_update_buyer_cancel"
  on "public"."bookings"
  as permissive
  for update
  to public
using ((buyer_id = auth.uid()))
with check ((status = 'cancelled'::text));



  create policy "bookings_update_seller"
  on "public"."bookings"
  as permissive
  for update
  to public
using ((seller_id = auth.uid()))
with check ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'confirmed'::text, 'rejected'::text, 'cancelled'::text, 'expired'::text])));



  create policy "Users can view messages in their chats"
  on "public"."messages"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT chats.seller_id
   FROM public.chats
  WHERE (chats.id = messages.chat_id)
UNION
 SELECT chats.buyer_id
   FROM public.chats
  WHERE (chats.id = messages.chat_id))));



  create policy "notifications_delete_owner"
  on "public"."notifications"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "notifications_insert_server"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check (true);



  create policy "notifications_select_owner"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "notifications_update_owner"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Product owners can manage their images"
  on "public"."product_images"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.products
  WHERE ((products.id = product_images.product_id) AND (products.seller_id = auth.uid())))));


CREATE TRIGGER booking_insert_notify AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_insert();

CREATE TRIGGER booking_update_accept_notify AFTER UPDATE ON public.bookings FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.notify_on_booking_accepted();

CREATE TRIGGER trg_bookings_notify_insert AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_notify_insert();

CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_on_booking_accepted AFTER UPDATE ON public.bookings FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.on_booking_accepted();

CREATE TRIGGER "Notification" AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://qxyzuzlkcmmrbdavzjnf.supabase.co/functions/v1/smart-processor', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eXp1emxrY21tcmJkYXZ6am5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MTM2MywiZXhwIjoyMDc5NDY3MzYzfQ.NE5-voZwLT__zz6NYsFco7fXskGxcqQIZKsEjnzUkz0"}', '{}', '5000');

CREATE TRIGGER "Notifications" AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://qxyzuzlkcmmrbdavzjnf.supabase.co/functions/v1/rapid-responder', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eXp1emxrY21tcmJkYXZ6am5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MTM2MywiZXhwIjoyMDc5NDY3MzYzfQ.NE5-voZwLT__zz6NYsFco7fXskGxcqQIZKsEjnzUkz0"}', '{}', '5000');

CREATE TRIGGER notifications AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://qxyzuzlkcmmrbdavzjnf.supabase.co/functions/v1/rapid-responder', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eXp1emxrY21tcmJkYXZ6am5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MTM2MywiZXhwIjoyMDc5NDY3MzYzfQ.NE5-voZwLT__zz6NYsFco7fXskGxcqQIZKsEjnzUkz0"}', '{}', '4981');

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow avatar read access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Allow avatar uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



