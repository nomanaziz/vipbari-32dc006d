UPDATE site_settings SET value = '"Vara Plus"'::jsonb WHERE key = 'app_name';
UPDATE site_settings SET value = '"support@varaplus.xyz"'::jsonb WHERE key = 'support_email';

UPDATE cms_pages SET
  content_bn = replace(replace(replace(replace(content_bn, 'vipbari.com', 'varaplus.xyz'), 'vipbari.lovable.app', 'varaplus.xyz'), 'VIP Bari', 'Vara Plus'), 'ভিআইপি বাড়ি', 'ভাড়া প্লাস'),
  content_en = replace(replace(replace(content_en, 'vipbari.com', 'varaplus.xyz'), 'vipbari.lovable.app', 'varaplus.xyz'), 'VIP Bari', 'Vara Plus'),
  title_bn = replace(replace(title_bn, 'VIP Bari', 'Vara Plus'), 'ভিআইপি বাড়ি', 'ভাড়া প্লাস'),
  title_en = replace(title_en, 'VIP Bari', 'Vara Plus');

UPDATE landing_sections SET
  value_bn = replace(replace(replace(replace(value_bn, 'vipbari.com', 'varaplus.xyz'), 'vipbari.lovable.app', 'varaplus.xyz'), 'VIP Bari', 'Vara Plus'), 'ভিআইপি বাড়ি', 'ভাড়া প্লাস'),
  value_en = replace(replace(replace(value_en, 'vipbari.com', 'varaplus.xyz'), 'vipbari.lovable.app', 'varaplus.xyz'), 'VIP Bari', 'Vara Plus');