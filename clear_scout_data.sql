-- Clear all Outlier Scout data from Supabase
-- Run this in your Supabase SQL Editor to start fresh

DELETE FROM public.os_blueprints;
DELETE FROM public.os_outliers;
DELETE FROM public.os_channels;

-- All scout data cleared!
-- You can now scout fresh channels.
