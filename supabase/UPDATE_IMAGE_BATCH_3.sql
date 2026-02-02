-- =====================================================
-- PRODUCT IMAGE NORMALIZATION - BATCH 2
-- =====================================================

-- =====================================================
-- DELL XPS 15
-- =====================================================
-- Variants in DB (Laptops): 'Negro', 'Plata', 'Gris'
-- User Request: White, Grey, Black
-- Mapping: White->Plata, Grey->Gris, Black->Negro

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769963983/Gemini_Generated_Image_osi0seosi0seosi0_p4qaac.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'dell-xps-15') AND color = 'Plata';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769963983/Gemini_Generated_Image_f9ljf6f9ljf6f9lj_wqz5f3.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'dell-xps-15') AND color = 'Gris';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769963983/Gemini_Generated_Image_qsdgo8qsdgo8qsdg_xhiwcz.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'dell-xps-15') AND color = 'Negro';

-- =====================================================
-- GOPRO HERO 12
-- =====================================================
-- Variants in DB (Other): 'Negro', 'Blanco', 'Gris'
-- User Request: White, Black, Grey

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965211/Gemini_Generated_Image_ll7vobll7vobll7v_nww9w2.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'gopro-hero-12') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965210/Gemini_Generated_Image_q6n8qgq6n8qgq6n8_i3efrh.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'gopro-hero-12') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965210/Gemini_Generated_Image_73tpri73tpri73tp_tnbqph.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'gopro-hero-12') AND color = 'Gris';

-- =====================================================
-- IPAD PRO 12.9 M2
-- =====================================================
-- Variants in DB (Tablets): 'Negro', 'Blanco', 'Gris Espacial'
-- User Request: gris espacial, plata
-- Mapping: gris espacial->Gris Espacial, plata->Blanco (closest match)

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965210/9818ad24-e198-4074-aa4d-f2eea9db714f_gkgk3t.jpg'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2') AND color = 'Gris Espacial';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965210/Gemini_Generated_Image_kntd0okntd0okntd_cqaion.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'ipad-pro-129-m2') AND color = 'Blanco';

-- =====================================================
-- APPLE WATCH ULTRA
-- =====================================================
-- Variants in DB (Other): 'Negro', 'Blanco', 'Gris'
-- User Request: White, Grey, Black

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965210/Gemini_Generated_Image_8aruek8aruek8aru_wruhjp.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'apple-watch-ultra') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965207/Gemini_Generated_Image_t0bw32t0bw32t0bw_fqn4ac.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'apple-watch-ultra') AND color = 'Gris';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965375/c06b72d3-3707-4359-a42c-44bdad8290d7_v8ks7f.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'apple-watch-ultra') AND color = 'Negro';

-- =====================================================
-- LG ULTRAWIDE 34
-- =====================================================
-- Variants in DB (Other): 'Negro', 'Blanco', 'Gris'

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965206/Gemini_Generated_Image_7bd0fk7bd0fk7bd0_oousmc.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'lg-ultrawide-34') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965207/Gemini_Generated_Image_np59ztnp59ztnp59_ruvmqx.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'lg-ultrawide-34') AND color = 'Gris';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965206/95754d8a-c928-46bf-b6fb-63fda45ba550_k3gdlq.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'lg-ultrawide-34') AND color = 'Negro';

-- =====================================================
-- XBOX SERIES X
-- =====================================================

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965206/Gemini_Generated_Image_lb22mulb22mulb22_hmfxvb.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'xbox-series-x') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965206/7289e3ec-2d9b-4245-982c-c9506e6159b1_yjhbtf.jpg'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'xbox-series-x') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965205/Gemini_Generated_Image_ly8y0uly8y0uly8y_mlhnvm.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'xbox-series-x') AND color = 'Gris';

-- =====================================================
-- SAMSUNG GALAXY WATCH 6
-- =====================================================
-- Slug in DB: samsung-galaxy-watch-6-classic

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965203/Gemini_Generated_Image_wu4479wu4479wu44_v9wh6h.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-watch-6-classic') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965204/a49d2d55-fe60-4779-a789-b3b48a0f91cb_idoxuw.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-watch-6-classic') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965204/Gemini_Generated_Image_v19j9v19j9v19j9v_fxjjzk.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-watch-6-classic') AND color = 'Gris';

-- =====================================================
-- PLAYSTATION 5
-- =====================================================

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965202/2c28362e-ff48-449a-b3d7-6557147cdbce_weykiw.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'playstation-5') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965202/Gemini_Generated_Image_cvyv4rcvyv4rcvyv_rweiac.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'playstation-5') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965201/Gemini_Generated_Image_x7mv9lx7mv9lx7mv_jze3by.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'playstation-5') AND color = 'Gris';

-- =====================================================
-- AIRPODS PRO 2
-- =====================================================

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965201/e727d187-53f7-49c5-b7b2-2861f5c4cb73_ibkab2.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'airpods-pro-2') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965201/Gemini_Generated_Image_iidtr4iidtr4iidt_rxx3j3.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'airpods-pro-2') AND color = 'Gris';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965200/Gemini_Generated_Image_5ia0wn5ia0wn5ia0_pkeqas.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'airpods-pro-2') AND color = 'Negro';

-- =====================================================
-- SONY WH-1000XM5
-- =====================================================

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965198/Gemini_Generated_Image_l7iqlgl7iqlgl7iq_skjyvf.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965199/3133e54b-a27d-4751-98c7-f3017c793a80_j3ufk4.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965198/Gemini_Generated_Image_lib20ulib20ulib2_tbb4ek.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'sony-wh-1000xm5') AND color = 'Gris';

-- =====================================================
-- SAMSUNG GALAXY S24 ULTRA
-- =====================================================
-- Variants in DB (Smartphones): 'Negro', 'Blanco', 'Azul', 'Rojo'

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965198/Gemini_Generated_Image_1863hq1863hq1863_ehz2bi.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra') AND color = 'Rojo';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965198/Gemini_Generated_Image_f59x6pf59x6pf59x_sd9rxj.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965195/Gemini_Generated_Image_wvddqxwvddqxwvdd_kjmom7.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965195/Gemini_Generated_Image_14u2k314u2k314u2_ggic33.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'samsung-galaxy-s24-ultra') AND color = 'Azul';

-- =====================================================
-- IPHONE 15 PRO MAX
-- =====================================================

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965195/Gemini_Generated_Image_kg7yvdkg7yvdkg7y_x2rj2l.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-15-pro-max') AND color = 'Rojo';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965194/Gemini_Generated_Image_hgj5johgj5johgj5_c6kcdm.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-15-pro-max') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965195/Gemini_Generated_Image_a8kr1ga8kr1ga8kr_b0gf10.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-15-pro-max') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965195/Gemini_Generated_Image_4g7b3d4g7b3d4g7b_abyix9.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-15-pro-max') AND color = 'Azul';

-- =====================================================
-- IPHONE 17
-- =====================================================
-- Assumed to behave like Smartphones ('Negro', 'Blanco', 'Azul', 'Rojo')

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965194/Gemini_Generated_Image_jgzomfjgzomfjgzo_zolxxi.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-17') AND color = 'Blanco';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965194/cb3819c1-388c-409f-a8fa-23ec41cde58c_beo3tj.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-17') AND color = 'Negro';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965194/Gemini_Generated_Image_ejtv8eejtv8eejtv_ssqeus.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-17') AND color = 'Azul';

UPDATE variantes_producto SET imagen_url = 'https://res.cloudinary.com/djvj32zic/image/upload/v1769965194/Gemini_Generated_Image_k4jmxmk4jmxmk4jm_b70lqs.png'
WHERE producto_id = (SELECT id FROM productos WHERE slug = 'iphone-17') AND color = 'Rojo';
