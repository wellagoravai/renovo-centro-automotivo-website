import React, { useState } from 'react';
import './VirtualAssistant.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface QuestionOption {
  id: string;
  text: string;
  category: string;
}

const VirtualAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! 👋 Bem-vindo à Renovo Centro Automotivo. Como posso ajudá-lo?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [showOptions, setShowOptions] = useState(true);

  const knowledgeBase: Record<string, string> = {
    horario: '⏰ Nosso horário de atendimento é:\n• Segunda a Sexta: 8h às 18h\n• Sábado: 8h às 13h\n• Domingo: Fechado',
    localizacao: '📍 Estamos localizados em:\nMARECHAL DEODORO 2305\nAndradina/SP 16901-455\n\nVocê pode encontrar nossa localização no mapa na página inicial.',
    servicos: '🔧 Oferecemos serviços de:\n• Manutenção preventiva\n• Reparos em geral\n• Diagnóstico completo\n• Peças de reposição\n\nVenha com a Renovo, segurança, confiança e qualidade!',
    manutencao: '🛠️ Manutenção Preventiva:\n• Troca de óleo e filtros\n• Revisão de pastilhas\n• Inspeção completa\n• Alinhamento e balanceamento\n\nAgende sua manutenção agora!',
    pagamento: '💳 Aceitamos:\n• Dinheiro\n• Cartão de crédito\n• Cartão de débito\n• PIX\n\nConsulte-nos sobre condições especiais!',
    orcamento: '💰 Para um orçamento:\n• Descreva o problema do seu veículo\n• Indique o modelo e ano\n• Deixe seus dados de contato\n\nNosso time analisará e enviará um orçamento!',
    contato: '📞 Entre em contato:\n• Telefone: (18) 3722-2388\n• Email: contato@renovocentroautomotivo.com\n• WhatsApp: (18) 3722-2388',
  };

  const frequentQuestions: QuestionOption[] = [
    { id: 'horario', text: '⏰ Qual é o horário de funcionamento?', category: 'info' },
    { id: 'localizacao', text: '📍 Onde vocês estão localizados?', category: 'info' },
    { id: 'servicos', text: '🔧 Quais serviços vocês oferecem?', category: 'services' },
    { id: 'manutencao', text: '🛠️ O que é manutenção preventiva?', category: 'services' },
    { id: 'pagamento', text: '💳 Quais são as formas de pagamento?', category: 'info' },
    { id: 'orcamento', text: '💰 Como solicitar um orçamento?', category: 'services' },
    { id: 'contato', text: '📞 Preciso de contato com um atendente', category: 'contact' },
  ];

  const handleQuestionClick = (questionId: string) => {
    const question = frequentQuestions.find(q => q.id === questionId);
    if (question) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: question.text,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      setTimeout(() => {
        let botResponse = knowledgeBase[questionId] || 'Desculpe, não entendi. Como posso ajudá-lo?';

        if (questionId === 'contato') {
          botResponse = `${botResponse}\n\n📋 Você gostaria de ser transferido para um atendente humano?`;
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);

        if (questionId === 'contato') {
          setShowOptions(false);
        } else {
          setShowOptions(true);
        }
      }, 500);
    }
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: userInput,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Obrigado por sua mensagem! Um atendente humano responderá em breve. 😊',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setShowOptions(false);
      }, 500);

      setUserInput('');
    }
  };

  return (
    <div className="virtual-assistant">
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Renovo Chat</h3>
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
          </div>

          {showOptions && (
            <div className="chat-options">
              <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#666' }}>
                Perguntas frequentes:
              </p>
              {frequentQuestions.map((q) => (
                <button
                  key={q.id}
                  className="option-button"
                  onClick={() => handleQuestionClick(q.id)}
                >
                  {q.text}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-area">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              className="chat-input"
            />
            <button
              onClick={handleSendMessage}
              className="send-button"
              aria-label="Enviar mensagem"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualAssistant;
