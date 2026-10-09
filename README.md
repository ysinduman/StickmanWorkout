# Stickman Workout

Antrenman motivasyonu veren, seriye (streak) ve kas bazlı seviyelere göre dinamik olarak evrimleşen bir çöp adam (stickman) mobil fitness uygulaması.

---

## 🚀 Son Güncelleme: 1–100 Dinamik Kas Evrim Motoru

Stickman karakteri statik resimler yerine `react-native-svg` üzerinde **tamamen prosedürel (matematiksel)** olarak çizilir. Her kas bölgesi bağımsız olarak 1'den 100+ seviyeye kadar 3 ana evreden geçer:

### 1. Seviye 1 – 50: Kas Hipertrofisi ve Hacim Büyümesi
* **Biceps (Pazu):** Cılız koldan devasa pazu yumrusuna genişler.
* **Chest (Göğüs):** İnce omuz çizgisinden geniş, zırh plaka şeklinde pektoral kaslara dönüşür.
* **Abs (Karın):** Düz gövdeden derin kesimli 2'li, 4'lü ve 6'lı karın tuğlalarına (shredded six-pack) evrilir.
* **Shoulders (Omuzlar):** Eklem noktasında kafa boyutuna yaklaşan 3D gülle (cannonball) deltoidlere büyür.
* **Back (Kanatlar - Lats):** Gövdeden iki yana açılan geniş V-Taper sırt kanatları oluşur.
* **Bacaklar (Quads & Calves):** Dış bacak kavisi (quad sweep) ve elmas kalf kasları belirir.
* **50. Seviye:** Maksimum kas hacmine (`growth = 1.0`) ulaşır.

### 2. Seviye 51 – 99: Damarlanma (Vascularity) Aşaması
* 50. seviyeden sonra kas boyutu korunurken her yeni seviyede kasların üzerine dallanan vasküler damar hatları eklenir.
* Seviye arttıkça damarların sayısı (1'den 4'e kadar dallanma), kalınlığı ve belirginliği artar (`vascularity: 0.02 → 1.0`).
* Biceps cephalic damarı, göğüs damarları, alt karın (Apollo kemeri) damarları ve ön bacak femoral damarları belirir.

### 3. Seviye 100+: Prestij Kademesi & Renk Değişimi
* **Seviye 100 – 199 (Altın Prestij):** Kas grubu ve damarları **Altın (`#FFD700`)** rengine bürünür ve arkasında altın aura parıltısı yanar.
* **Seviye 200 – 299 (Elmas Mavi):** Siber platin / elmas mavi (`#00F0FF`) tier.
* **Seviye 300+ (Kozmik Mor):** Efsanevi mor (`#BD00FF`) aura.

---

## 🛠️ Mimari ve Teknolojiler

* **Mobil Çatı:** Bare React Native 0.87.1, React 19.2.3 (Hermes, New Architecture)
* **Vektörel Çizim:** `react-native-svg` (prosedürel koordinat hesaplamaları)
* **Durum Yönetimi:** `zustand` + `@react-native-async-storage/async-storage`
* **Navigasyon:** `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`
* **Dil Desteği:** `i18next` (Türkçe & İngilizce)
* **Backend:** Supabase (PostgreSQL, Row Level Security, Security Definer RPC'ler)

---

## 📂 Proje Yapısı ve Geliştirici Araçları

* `src/components/Stickman/`
  * `Stickman.tsx`: Dinamik SVG çöp adam bileşeni.
  * `evolution.ts`: 1-100 kas büyüme, damarlanma ve prestij renk hesaplama motoru.
* `scripts/`
  * `verify-evolution.js`: 11 kas grubu için 1-105 seviyelerini (1.155 durum) doğrulayan test betiği.
* `gelistirici_detaylari/`
  * Derleme ve runtime dışındaki tasarım/fikir dokümanları burada tutulur.
  * `stickman_evolution_preview.html`: Herhangi bir tarayıcıda çift tıklanarak çalıştırılabilen, kas seviyelerini slider ile 1'den 100'e çekip canlı SVG evrimini gösteren önizleme aracı.

---

## 🧪 Doğrulama ve Test

```bash
# Evrim motoru testlerini çalıştır (1.155 durum testi)
node scripts/verify-evolution.js

# TypeScript tür kontrolü
npx tsc --noEmit
```
