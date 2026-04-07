-- Clean up orphaned tenant record where auth user no longer exists
DELETE FROM tenants WHERE id = '51e58cd3-f53f-46c3-b6f9-fd4e3febc30f' AND user_id = 'cead14cf-8a54-45e1-bdda-46630bc2ab81';