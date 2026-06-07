import { useState } from 'react';
import { useInstallPrompt } from '../pwa/install.js';
import { Modal } from './ui.jsx';

// "Апп болгож суулгах" товч.
//  • Chrome/Edge: шууд суулгах диалог нээнэ.
//  • iOS Safari: гар аргаар суулгах зааврыг харуулна.
//  • Аль хэдийн суулгасан (standalone) бол харагдахгүй.
export default function InstallButton({ className = 'btn-outline', compact = false }) {
  const { canInstall, promptInstall, standalone, ios } = useInstallPrompt();
  const [showIOS, setShowIOS] = useState(false);

  if (standalone) return null;
  if (!canInstall && !ios) return null; // суулгах боломжгүй браузер

  const label = compact ? '📲' : '📲 Апп суулгах';

  return (
    <>
      <button
        className={className}
        title="Утсанд апп болгож суулгах"
        onClick={() => (ios ? setShowIOS(true) : promptInstall())}
      >
        {label}
      </button>

      <Modal open={showIOS} onClose={() => setShowIOS(false)} title="iPhone дээр суулгах">
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="font-bold text-brand-600">1.</span>
            <span>Доод талын <strong>Хуваалцах</strong> товч <span className="inline-block">⬆️</span> дээр дарна.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-brand-600">2.</span>
            <span><strong>"Add to Home Screen / Нүүр дэлгэцэд нэмэх"</strong>-ийг сонгоно.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-brand-600">3.</span>
            <span><strong>"Add / Нэмэх"</strong> дарвал нүүр дэлгэцэд 🎓 апп үүснэ.</span>
          </li>
        </ol>
      </Modal>
    </>
  );
}
