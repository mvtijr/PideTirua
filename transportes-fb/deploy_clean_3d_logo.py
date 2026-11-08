import shutil

# Deploy test_3d_user_clean.png to production assets
src_file = 'transportes-fb/test_3d_user_clean.png'
dest_file = 'transportes-fb/assets/logo-fb-3d.png'
pub_file = 'public/transportes-fb/assets/logo-fb-3d.png'

artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
art_file = f'{artifact_dir}/logo-fb-3d.png'
user_upload_art = f'{artifact_dir}/logo-fb-3d-checker-uploaded.jpg'
user_src = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794031265213_83245839.jpg'

shutil.copyfile(src_file, dest_file)
shutil.copyfile(src_file, pub_file)
shutil.copyfile(src_file, art_file)
shutil.copyfile(user_src, user_upload_art)

print('Successfully deployed clean transparent 3D logo to all destinations!')
