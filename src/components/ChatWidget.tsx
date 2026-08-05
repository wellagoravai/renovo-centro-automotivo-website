import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface LeadForm {
  name: string;
  phone: string;
  subject: string;
  carModel: string;
  carYear: string;
}

const emptyLeadForm: LeadForm = { name: '', phone: '', subject: '', carModel: '', carYear: '' };

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! 👋 Sou o assistente virtual da Renovo Centro Automotivo. Como posso ajudá-lo hoje?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const emergencyKeywords = [
    'quebrou', 'pane', 'nao liga', 'não liga', 'nao pega', 'não pega', 'parou',
    'acidente', 'batida', 'bati', 'bateu', 'pneu furou', 'furou o pneu', 'fumaça',
    'fumaca', 'travou', 'estourou',
  ];

  const isEmergency = (text: string) => {
    const normalized = text.toLowerCase();
    return emergencyKeywords.some((kw) => normalized.includes(kw));
  };

  // Respostas mais soltas, tipo alguém que realmente lê a mensagem e responde —
  // nada de "atendimento personalizado" ou textão de script de call center.
  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (isEmergency(lowerMessage)) {
      return 'Poxa, sinto muito, que chato isso acontecer! 😟 Fica tranquilo(a) que a gente resolve rapidinho. Já vou preparar um pedido de guincho pra você — só preciso de mais uns dadinhos ali embaixo. 🚛';
    }

    if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('custo')) {
      return 'Depende bastante do carro e do que precisa ser feito, então prefiro não chutar um valor aqui 😅 Me conta rapidinho qual é o problema (ou preenche o formulário abaixo) que a gente te passa um orçamento certinho, sem enrolação.';
    }

    if (lowerMessage.includes('horário') || lowerMessage.includes('funcionamento') || lowerMessage.includes('aberto')) {
      return 'Nossas portas ficam abertas de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 13h. Esse chat aqui, porém, eu fico de olho 24h! 😊';
    }

    if (lowerMessage.includes('endereço') || lowerMessage.includes('localização') || lowerMessage.includes('onde')) {
      return 'A gente fica na Marechal Deodoro, 2305, aqui em Andradina/SP. 📍 Se quiser, dá uma olhada no mapa lá na página inicial pra ver certinho como chegar.';
    }

    if (lowerMessage.includes('serviço') || lowerMessage.includes('manutenção') || lowerMessage.includes('reparo')) {
      return 'Fazemos de tudo um pouco por aqui: manutenção preventiva, reparo geral, diagnóstico, elétrica, ar-condicionado... Me conta o que está pegando no seu carro que eu já te oriento melhor. 🔧';
    }

    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
      return 'Bora marcar então! Preenche seus dados ali embaixo que eu te encaminho direto pro WhatsApp com tudo pronto, só combinar o melhor horário com a equipe. 🗓️';
    }

    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
      return 'Oi, tudo bem? 😊 Me conta, o que está pegando no seu carro ou como posso te ajudar hoje?';
    }

    if (lowerMessage.includes('obrigado') || lowerMessage.includes('obrigada') || lowerMessage.includes('valeu')) {
      return 'Isso aí, disponha! Qualquer coisa é só chamar por aqui de novo. 🙏';
    }

    // Resposta padrão: mais próxima de "deixa eu te passar pra equipe" do que um script
    return 'Entendi! Pra te ajudar direito nisso, acho melhor eu já te encaminhar pra equipe no WhatsApp — clica no botão verde aí embaixo que é rapidinho. 🟢';
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const wasEmergency = isEmergency(inputValue);

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simula delay de digitação do bot
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);

      // Carro quebrado é urgência de verdade — não faz sentido ficar batendo papo,
      // então já abre o formulário (com "Guincho 24h" marcado) pra agilizar.
      if (wasEmergency) {
        setShowLeadForm(true);
        setLeadForm((prev) => ({ ...prev, subject: 'Guincho 24h' }));
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Em vez de mandar pro WhatsApp com um texto genérico, pede alguns dados antes —
  // assim quem atende já chega sabendo nome, contato, assunto e veículo, sem precisar
  // perguntar tudo de novo.
  const openLeadForm = () => {
    setShowLeadForm(true);
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: 'Claro! Preencha os dados abaixo para eu te encaminhar direto pro WhatsApp com tudo já explicado. 📝',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lines = [
      'Olá! Vim pelo chat do site.',
      `Nome: ${leadForm.name}`,
      `Telefone: ${leadForm.phone}`,
      `Assunto: ${leadForm.subject}`,
    ];
    const vehicle = [leadForm.carModel, leadForm.carYear].filter(Boolean).join(' - ');
    if (vehicle) lines.push(`Veículo: ${vehicle}`);

    const whatsappNumber = '551837222388';
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: `Perfeito, ${leadForm.name.split(' ')[0] || ''}! Abri o WhatsApp com seus dados prontos, é só enviar a mensagem por lá. 🟢`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    setShowLeadForm(false);
    setLeadForm(emptyLeadForm);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.48 3.53 1.31 5.02L2.5 22l5.13-1.34C8.76 21.73 10.35 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.21 0-2.39-.18-3.49-.51l-.39-.13-3.06.8.82-2.98-.13-.4C5.18 15.39 5 14.21 5 13c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
          </svg>
        )}
        {!isOpen && <span className="chat-badge">💬</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.48 3.53 1.31 5.02L2.5 22l5.13-1.34C8.76 21.73 10.35 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.21 0-2.39-.18-3.49-.51l-.39-.13-3.06.8.82-2.98-.13-.4C5.18 15.39 5 14.21 5 13c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                </svg>
              </div>
              <div>
                <h3>Renovo Centro Automotivo</h3>
                <p className="chat-status">🟢 Online - Atendimento 24h</p>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message bot-message">
                <div className="message-content typing">
                  <p></p>
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {showLeadForm ? (
            <form className="lead-form" onSubmit={handleLeadSubmit}>
              <input
                name="name"
                required
                placeholder="Seu nome"
                value={leadForm.name}
                onChange={handleLeadChange}
              />
              <input
                name="phone"
                required
                type="tel"
                placeholder="Seu telefone"
                value={leadForm.phone}
                onChange={handleLeadChange}
              />
              <select name="subject" required value={leadForm.subject} onChange={handleLeadChange}>
                <option value="">Assunto</option>
                <option>Troca de óleo</option>
                <option>Diagnóstico / revisão</option>
                <option>Elétrica automotiva</option>
                <option>Ar-condicionado</option>
                <option>Guincho 24h</option>
                <option>Outro serviço</option>
              </select>
              <div className="lead-form-row">
                <input
                  name="carModel"
                  placeholder="Modelo do carro"
                  value={leadForm.carModel}
                  onChange={handleLeadChange}
                />
                <input
                  name="carYear"
                  placeholder="Ano"
                  inputMode="numeric"
                  maxLength={4}
                  value={leadForm.carYear}
                  onChange={handleLeadChange}
                />
              </div>
              <div className="lead-form-actions">
                <button type="button" className="lead-form-cancel" onClick={() => setShowLeadForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="lead-form-submit">
                  Enviar no WhatsApp
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="chat-input-container">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="chat-input"
                />
                <button
                  onClick={handleSendMessage}
                  className="chat-send-button"
                  disabled={!inputValue.trim()}
                  aria-label="Enviar mensagem"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>

              <button className="whatsapp-button" onClick={openLeadForm}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Falar com Atendente</span>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;