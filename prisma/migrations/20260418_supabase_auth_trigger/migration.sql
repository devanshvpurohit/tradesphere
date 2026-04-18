-- function to handle new user registration in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email, balance, "updatedAt")
  VALUES (new.id, new.email, 100000, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger that executes the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
