import React from 'react';
import { COMPANY, TOW_COMPANY } from '../utils/towQuote/company';
import { ADDRESS, CONTACT_EMAIL, CONTACT_PHONE } from '../utils/constants';

const Privacy: React.FC = () => (
    <article className="privacy-page">
        <h1>Política de Privacidade</h1>
        <p>Última atualização: 4 de novembro de 2026.</p>
        <p>
            Esta política explica como a Renovo trata os seus dados pessoais, conforme a
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>

        <h2>Quem cuida dos seus dados</h2>
        <ul>
            <li>
                <strong>Oficina:</strong> {COMPANY.name}
                {COMPANY.cnpj && `, CNPJ ${COMPANY.cnpj}`}.
            </li>
            <li>
                <strong>Guincho:</strong> {TOW_COMPANY.name} ({TOW_COMPANY.legalName}), CNPJ {TOW_COMPANY.cnpj}.
            </li>
        </ul>
        <p>Endereço: {ADDRESS}.</p>

        <h2>Quais dados tratamos e por quê</h2>
        <ul>
            <li>
                <strong>Pedidos de contato e orçamento:</strong> nome, telefone, dados do veículo e a
                mensagem que você escrever, para responder ao seu pedido. Os formulários e o chat do
                site não guardam essas informações: elas são montadas em uma mensagem que só é
                enviada se você confirmar o envio no WhatsApp.
            </li>
            <li>
                <strong>Prestação do serviço:</strong> nome, CPF ou CNPJ, telefone, e-mail, endereço,
                placa e dados do veículo, fotos do veículo, assinaturas e histórico de atendimentos,
                para executar o serviço contratado, emitir documentos e cumprir obrigações legais.
            </li>
            <li>
                <strong>Equipe:</strong> dados de login dos funcionários que usam o sistema interno,
                para controlar o acesso e manter a segurança.
            </li>
        </ul>

        <h2>Com quem compartilhamos</h2>
        <p>Não vendemos seus dados. Usamos fornecedores que nos ajudam a operar:</p>
        <ul>
            <li>WhatsApp (Meta): atendimento, quando você escolhe falar conosco por lá;</li>
            <li>Vercel e Railway: hospedagem do site e do sistema;</li>
            <li>Cloudinary: armazenamento das fotos dos veículos;</li>
            <li>Google: mapa, fontes do site e cálculo de rotas do guincho;</li>
            <li>APIBrasil: consulta de dados do veículo pela placa.</li>
        </ul>
        <p>
            Alguns desses fornecedores podem tratar dados fora do Brasil. Também podemos compartilhar
            dados quando a lei ou uma autoridade competente exigir.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
            Mantemos os dados pelo tempo necessário para prestar o serviço, cumprir obrigações legais
            e fiscais e exercer direitos em eventuais processos. Depois disso, eles são eliminados ou
            anonimizados.
        </p>

        <h2>Cookies e armazenamento no navegador</h2>
        <p>
            O site não usa cookies de publicidade nem de estatísticas. O navegador guarda apenas o seu
            tema preferido e, para a equipe, a sessão de login. O mapa incorporado é fornecido pelo
            Google, que pode usar cookies próprios conforme a política dele.
        </p>

        <h2>Seus direitos</h2>
        <p>
            Você pode pedir a confirmação do tratamento, o acesso, a correção, a portabilidade, a
            eliminação dos dados desnecessários ou tratados com base no seu consentimento, informações
            sobre o compartilhamento e a revogação do consentimento. Também pode reclamar à Autoridade
            Nacional de Proteção de Dados (ANPD).
        </p>

        <h2>Fale conosco sobre privacidade</h2>
        <p>
            E-mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <br />
            Telefone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a>
        </p>
    </article>
);

export default Privacy;
