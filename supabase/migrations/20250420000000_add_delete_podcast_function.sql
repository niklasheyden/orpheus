-- Create a function to safely delete a podcast and all its related data
CREATE OR REPLACE FUNCTION delete_podcast(p_podcast_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  podcast_record podcasts%ROWTYPE;
  audio_path text;
BEGIN
  -- First, verify the podcast exists and belongs to the user
  SELECT * INTO podcast_record
  FROM podcasts
  WHERE id = p_podcast_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Podcast not found or you do not have permission to delete it';
  END IF;

  -- Get the audio path for deletion
  audio_path := podcast_record.audio_url;
  IF audio_path LIKE '%storage/v1/object/public/podcasts/%' THEN
    audio_path := split_part(audio_path, 'storage/v1/object/public/podcasts/', 2);
  END IF;

  -- Delete the podcast record (this will cascade to likes and playlists)
  DELETE FROM podcasts
  WHERE id = p_podcast_id AND user_id = p_user_id;

  -- Delete the audio file from storage
  -- Note: This requires the postgres_storage extension
  DELETE FROM storage.objects
  WHERE bucket_id = 'podcasts'
  AND name = audio_path
  AND (storage.foldername(name))[1] = p_user_id::text;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$; 