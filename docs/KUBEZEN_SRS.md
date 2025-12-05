# Yeni Nesil Açık Kaynak Kubernetes Dashboard Geliştirme Raporu ve Yazılım Gereksinimleri Spesifikasyonu (SRS)

## 1. Yönetici Özeti
Bulut tabanlı teknolojilerin hızla benimsenmesiyle birlikte Kubernetes, modern uygulama dağıtımının fiili işletim sistemi haline gelmiştir. Bu dönüşüm, dağıtık sistemlerin yönetimi ve izlenmesi için güçlü görsel arayüzlere olan ihtiyacı artırmaktadır. Mevcut ekosistemde kullanıcılar çoğunlukla yüksek kaynak tüketen masaüstü IDE'ler ile sınırlı özelliklere sahip web arayüzleri arasında seçim yapmak zorunda kalmaktadır.

Bu rapor, geçici kod adı **KubeZen** olan yeni, yüksek performanslı ve tamamen açık kaynaklı bir Kubernetes dashboard projesi için kapsamlı bir araştırma ve Yazılım Gereksinimleri Spesifikasyonu (SRS) sunar. Pazar analizi, ölçeklenebilirlik, güvenlik entegrasyonu ve satıcı bağımsızlığı konularında önemli boşluklar olduğunu göstermektedir. Önerilen çözüm; Go tabanlı bir backend, React ve TypeScript tabanlı bir frontend ile Informer pattern kullanarak 10.000+ pod barındıran kümelerde dahi milisaniyeler seviyesinde yanıt verecek şekilde tasarlanacaktır.

## 2. Pazar Analizi ve Mevcut Çözümlerin Derinlemesine İncelemesi
2025 itibarıyla Kubernetes arayüz pazarı üç ana kategoride incelenebilir:
- Web tabanlı arayüzler
- Masaüstü IDE'ler
- Terminal tabanlı araçlar

### 2.1 Mevcut Pazar Liderleri ve Mimari Yaklaşımları
#### 2.1.1 Resmi Kubernetes Dashboard (kubernetes/dashboard)
- **Durum:** Sürüm 7.0.0 itibarıyla manifest tabanlı kurulum bırakılıp yalnızca Helm + Kong gateway bağımlı mimariye geçildi.
- **Mimari analizi:** Angular’dan React’a geçiş tamamlandı; ancak Kong bağımlılığı ve genel amaçlı UI yaklaşımı, basit kurulum isteyen veya ileri seviye kullanıcılar için sınırlayıcı.
- **Eksikler:** Multi-cluster desteği zayıf, modern IDE deneyiminin gerisinde, log/shell özellikleri temel seviyede.

#### 2.1.2 OpenLens ve Lens Desktop
- **Pazar konumu:** “Kubernetes için IDE” kavramını popülerleştirdi; yerel kubeconfig ile kurulumsuz çalışabilmesi onay süreçlerini hızlandırdı.
- **Kritik dönüşüm:** Ticarileşme sonrası OpenLens’ten pod shell ve log görüntüleme gibi temel özelliklerin çıkarılması toplulukta güven kaybına yol açtı; üçüncü parti eklentilere bağımlılık arttı.

#### 2.1.3 Headlamp
- **Güçlü yönler:** Hem küme içi hem masaüstü çalışabilen hibrit yaklaşım; React + Go ile güçlü eklenti mimarisi.
- **Fırsat alanı:** Varsayılan kurulumda özellik seti sınırlı kalabiliyor; hedef, Headlamp’in genişletilebilirliğini Lens’in zengin UX’i ile birleştirmek.

#### 2.1.4 Skooner (eski adıyla K8Dash)
- **Teknik yaklaşım:** Minimum yapılandırma ile OIDC veya ServiceAccount token’larıyla hızlı çalışır; gerçek zamanlı güncellemeler ve mobil uyumluluk sağlar.
- **Sınırlılıklar:** Kurumsal yapılarda gereken derin analiz, CRD yönetimi ve gelişmiş filtreleme eksiktir; daha çok salt-okunur veya basit operasyonlar için uygundur.

### 2.2 Pazar Boşluk Analizi ve Stratejik Konumlandırma
Mevcut araçlar bazı kritik alanları karşılamada yetersiz kalmaktadır: ölçeklenebilirlik, güvenlik entegrasyonu, kurulum sadeliği, multi-cluster yönetimi ve eklenti ekosistemi.

| Özellik / Gereksinim           | Kubernetes Dashboard | OpenLens          | Headlamp        | Skooner          | Yeni Proje Hedefi              |
| ------------------------------ | -------------------- | ----------------- | --------------- | ---------------- | ------------------------------ |
| Mimari tipi                    | Web (cluster-side)   | Masaüstü (client) | Hibrit          | Web (cluster)    | Hibrit (web öncelikli)         |
| Ölçeklenebilirlik (10k+ Pod)   | Düşük                | Orta (RAM yüksek) | Orta            | Düşük            | Çok yüksek (sanal liste)       |
| Kurulum karmaşıklığı           | Yüksek (Kong)        | Düşük (yerel)     | Orta            | Çok düşük        | Düşük (tek binary/Helm)        |
| Eklenti desteği                | Yok                  | Var (sınırlı API) | Var (güçlü)     | Yok              | Tam modüler yapı               |
| Çoklu küme yönetimi            | Zayıf                | Güçlü             | İyi             | Yok              | Merkezi yönetim                |
| Lisans / yönetişim             | CNCF                 | MIT (kısıtlı)     | CNCF            | Apache 2.0       | Tam açık kaynak                |

**Temel felsefe:** Lens’in kullanıcı deneyimi, Headlamp’in genişletilebilirliği ve Skooner’in hafifliğini birleştiren, kurumsal ölçekte web öncelikli bir arayüz.

## 3. Mimari Vizyon ve Teknoloji Yığını
Önerilen mimari, Backend-for-Frontend (BFF) desenini temel alır.

### 3.1 Backend Teknolojisi: Go (Golang)
- Kubernetes ekosistemiyle doğal entegrasyon (client-go, informer/watcher).
- Goroutine tabanlı eşzamanlılık ile düşük bellek tüketimi; binlerce WebSocket bağlantısını verimli yönetme.
- Güçlü tip sistemiyle Kubernetes API veri yapılarında derleme zamanı doğrulama.

### 3.2 Frontend Teknolojisi: React ve TypeScript
- Bileşen bazlı mimari; eklenti sistemine uygun.
- Durum yönetimi için Redux Toolkit veya Zustand; veri görselleştirme için Recharts/Nivo.
- YAML düzenleme için Monaco Editor entegrasyonu.

### 3.3 İletişim Protokolleri
- **HTTP/2 (REST):** İlk yükleme, konfigürasyon ve CRUD işlemleri.
- **WebSockets:** Gerçek zamanlı olay akışı; log ve terminal oturumları için çift yönlü kanal.

## 4. Ölçekte Performans Optimizasyonu
### 4.1 Backend: Informer Pattern ve Delta FIFO
- Başlangıçta LIST + WATCH ile yerel bellek içi önbellek oluşturulur.
- UI’nın ihtiyaç duymadığı büyük alanlar (ör. managedFields) SetTransform ile atılarak bellek tüketimi kontrol altında tutulur.

### 4.2 Frontend: UI Sanallaştırma (Virtualization)
- React-Window/React-Virtualized ile sadece görünür satırları render ederek 10k+ satırlık listelerde sabit bellek kullanımı ve 60 FPS kaydırma sağlanır.
- WebSocket güncellemeleri arka planda store’u günceller; yalnızca görünür satırlar yeniden render edilir.

### 4.3 API Yanıt Akışı (Streaming)
- Log ve büyük JSON yanıtları için chunked/streaming gönderim; Go `json.Encoder` veya Kubernetes 1.30+ streaming özellikleriyle düşük TTFB.

## 5. Yazılım Gereksinimleri Spesifikasyonu (Fonksiyonel)
### 5.1 Kimlik Doğrulama ve Yetkilendirme (AuthN/AuthZ)
- **FR-AUTH-01.1 OIDC entegrasyonu:** Keycloak, Google Identity, Okta, Azure AD desteği; alınan ID Token’ın Kubernetes API çağrılarında bearer olarak iletilmesi.
- **FR-AUTH-01.2 Kubeconfig desteği:** `~/.kube/config` okuma, context geçişi; exec tabanlı sağlayıcılarla uyum.
- **FR-AUTH-01.3 Servis hesabı token girişi:** Manuel JWT ile oturum açma.

### 5.2 İş Yükü (Workload) Yönetimi
- **FR-WORK-01.1 Detaylı görüntüleme:** Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob listeleri; status, events, ilişkili kaynak görselleştirmesi.
- **FR-WORK-01.2 Log yönetimi:** Gerçek zamanlı log izleme; multi-container seçim; previous termination logları; arama/filtreleme.
- **FR-WORK-01.3 Terminal erişimi:** Tarayıcı üzerinden `sh`/`bash` açma; xterm.js + WebSocket proxy.

### 5.3 Ağ ve Depolama Yönetimi
- **FR-NET-01.1 Servis ve Ingress haritası:** Trafik akışı görselleştirmesi; port/protokol gösterimi.
- **FR-NET-01.2 Depolama analizi:** PV/PVC durumu, bağlı podlar ve StorageClass bilgileri.

### 5.4 Konfigürasyon ve Gizli Veri Yönetimi
- **FR-CONF-01.1 ConfigMap/Secret düzenleme:** Secret değerleri varsayılan maskeli; yetkili kullanıcı isteğinde istemci tarafında Base64 çözümü.
- **FR-CONF-01.2 YAML editörü:** Şema doğrulamalı “YAML düzenle” seçeneği; hatalı girinti ve alan uyarıları.

### 5.5 Özel Kaynaklar (CRD) ve Operatör Desteği
- **FR-CRD-01.1 Dinamik keşif:** Kümedeki tüm CRD’leri otomatik keşfetme ve menüde listeleme.
- **FR-CRD-01.2 Jenerik CRUD:** Herhangi bir CRD için otomatik liste ve detay sayfası oluşturma.

## 6. Güvenlik ve Uyumluluk
### 6.1 En Az Yetki Prensibi (Least Privilege)
- Backend, cluster-admin yerine minimum yetkili ServiceAccount ile çalışır.
- Kullanıcı OIDC ile giriş yaptığında backend, API çağrılarında kullanıcı token’ını kullanarak yetki devri (impersonation/bearer pass-through) uygular; yetkisiz alanlarda 403 döner.

### 6.2 Güvenli Bağlantı ve Veri Koruma
- TLS sonlandırma (tercihen cert-manager entegrasyonu) ile HTTPS erişimi.
- Mutasyon isteklerinde Origin doğrulaması ve Anti-CSRF token mekanizması.
- Token/kubeconfig gibi hassas veriler localStorage’da düz metin tutulmaz; mümkün olduğunda HttpOnly + Secure cookie veya session storage kullanılır.

## 7. Eklenti Sistemi ve Genişletilebilirlik (Extensibility)
### 7.1 Eklenti Mimarisi
- Eklentiler bağımsız derlenmiş React paketleridir; açılışta `plugins.json` manifestinden dinamik yüklenir.
- Global `window.kubezen` SDK’sı: menü ekleme, bileşen enjeksiyonu, backend proxy üzerinden servis çağrıları.

### 7.2 Örnek Eklenti Senaryoları
- Prometheus eklentisi: Pod listesinde CPU/RAM sparkline gösterimi.
- Trivy/Clair güvenlik eklentisi: Deployment detayında imaj zafiyet raporu.
- ArgoCD/Flux eklentisi: Kaynağın GitOps senkronizasyon durumu ve commit bilgisi.

## 8. Geliştirme Yol Haritası (Roadmap) ve Sonuç
### Faz 1: Temel (MVP)
- Go backend ve temel React frontend kurulumu.
- client-go + SharedInformer altyapısı.
- Pod/Node/Deployment listeleri ve detay sayfaları.
- Sanal liste ile 10k pod testleri.
- OIDC kimlik doğrulama entegrasyonu.

### Faz 2: Etkileşim ve Yönetim
- Web Shell (xterm.js) ve log streaming (WebSocket).
- YAML editörü (Monaco) ve CRUD işlemleri.
- Multi-cluster konfigürasyon desteği.
- Eklenti SDK’sının ilk sürümü.

### Faz 3: İleri Seviye Özellikler
- Eklenti kütüphanesi (Prometheus, Grafana entegrasyonları).
- Gelişmiş ağ haritalama (Network Policy visualizer).
- Yapay zeka asistanı (log analizi ve öneri).

### Sonuç
KubeZen, yalnızca bir görselleştirme aracı değil, aynı zamanda bir operasyonel mükemmellik platformu olarak tasarlanmıştır. Go’nun performansı, React’ın esnekliği ve Kubernetes’in yerel desenlerinin birleşimiyle masaüstü IDE konforunu web erişilebilirliğiyle sunmayı hedefler. Açık kaynaklı yapısı ve güçlü eklenti sistemi, ticarileşen rakiplerin bıraktığı boşluğu doldurarak topluluğun yeni standardı olmaya adaydır.

## Referanslar ve Veri Kaynakları
Bu rapor; CNCF pazar verileri, resmi Kubernetes Dashboard dokümantasyonu, OpenLens/Lens topluluk tartışmaları, Headlamp ve Skooner teknik dokümanları, Go client-go ve informer pattern kaynakları, React/TypeScript/Monaco/xterm ekosistem kılavuzları gibi kamuya açık bilgilerden derlenmiştir.