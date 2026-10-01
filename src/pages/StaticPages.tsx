import { Helmet } from 'react-helmet-async';
import { SectionHeader } from '../components/SectionHeader';

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Tentang — Yozora</title>
        <meta name="description" content="Tentang platform pembaca komik Yozora." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <SectionHeader title="Tentang Yozora" />

        <div className="bg-surface border border-line p-5 sm:p-6 rounded-sm space-y-4 text-xs sm:text-sm text-main leading-relaxed">
          <p>
            Yozora adalah antarmuka pembaca komik digital berbahasa Indonesia yang dirancang untuk kecepatan dan keterbacaan tinggi. Platform ini berfokus pada pengalaman membaca yang bersih tanpa iklan mengganggu, penataan tipografi yang nyaman di mata, dan navigasi yang responsif.
          </p>

          <p>
            Seluruh metadata, gambar komik, dan rilisan bab dikumpulkan dari sumber publik pihak ketiga seperti Mangakita dan Westmanga. Yozora tidak mengunggah, menyimpan, maupun memodifikasi berkas komik pada peladen kami sendiri.
          </p>

          <p>
            Jika Anda menikmati komik yang dibaca di platform ini, dukung terus para komikus dan penerbit resmi dengan membeli karya cetak atau berlangganan layanan legal apabila telah tersedia di wilayah Anda.
          </p>
        </div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Kebijakan Privasi — Yozora</title>
        <meta name="description" content="Kebijakan privasi platform Yozora." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <SectionHeader title="Kebijakan Privasi" />

        <div className="bg-surface border border-line p-5 sm:p-6 rounded-sm space-y-4 text-xs sm:text-sm text-main leading-relaxed">
          <p>
            Yozora menghormati privasi pengguna. Kami tidak mengumpulkan data pribadi sensitif seperti nama asli, alamat surel, atau lokasi fisik pengguna. Platform ini dapat digunakan secara penuh tanpa keharusan mendaftarkan akun.
          </p>

          <p>
            Fitur penyimpanan lokal seperti bookmark bacaan, riwayat bab terakhir, dan preferensi tema (gelap/terang) disimpan langsung di peramban web perangkat Anda (localStorage). Data tersebut tidak dikirimkan ke basis data eksternal.
          </p>

          <p>
            Pengambilan gambar dan konten bab diteruskan melalui proksi aman demi melindungi privasi peramban Anda dari pelacak pihak ketiga dan menghindari hambatan pembatasan lintas domain.
          </p>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Kontak — Yozora</title>
        <meta name="description" content="Kontak pengelola platform Yozora." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <SectionHeader title="Kontak" />

        <div className="bg-surface border border-line p-5 sm:p-6 rounded-sm space-y-4 text-xs sm:text-sm text-main leading-relaxed">
          <p>
            Untuk pelaporan kendala teknis, saran perbaikan antarmuka, atau pertanyaan seputar penggunaan proksi bacaan komik, Anda dapat menghubungi kami melalui tautan komunitas berikut:
          </p>

          <div className="border-t border-b border-line py-3 font-mono text-xs space-y-1">
            <p>Surel: kontak@yozora.local</p>
            <p>GitHub: github.com/yozora-reader</p>
          </div>

          <p className="text-muted text-xs">
            Laporan mengenai galat bab gambar yang gagal dibuka dapat dilaporkan dengan menyertakan nama judul serta bab yang bersangkutan.
          </p>
        </div>
      </div>
    </>
  );
}
