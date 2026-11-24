import React from 'react';

interface DraftNoticeProps {
  visible: boolean;
  onDiscard: () => void;
  // Fotos não cabem no rascunho: avisa para escolher de novo.
  photosLost?: boolean;
}

const DraftNotice: React.FC<DraftNoticeProps> = ({ visible, onDiscard, photosLost }) => {
  if (!visible) return null;
  return (
    <div className="draft-notice" role="status">
      <span>
        📝 Recuperamos o que você já tinha digitado.
        {photosLost && ' Se tinha escolhido fotos, escolha de novo.'}
      </span>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Apagar o que foi recuperado e começar de novo?')) onDiscard();
        }}
      >
        Começar de novo
      </button>
    </div>
  );
};

export default DraftNotice;
