import React from 'react';
import { TOW_COMPANY } from '../utils/towQuote/company';
import { ADDRESS, CONTACT_EMAIL, CONTACT_PHONE } from '../utils/constants';

const Privacy: React.FC = () => (
    <article className="privacy-page">
        <h1>Política de Privacidade</h1>
        <p>Última atualização: 4 de novembro de 2026.</p>
        <p>
            Esta política explica, de forma simples, como a Renovo trata os seus dados pessoais, conforme
            a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
        </p>

        <h2>1. Quem é responsável pelos seus dados</h2>
        <p>
            A controladora dos dados é {TOW_COMPANY.legalName}, CNPJ {TOW_COMPANY.cnpj}, que atua com os
            nomes Renovo Centro Automotivo e Renovo Guincho. Endereço: {ADDRESS}. Ela decide como e por que
            os dados são usados. Os fornecedores da seção 4 tratam dados conforme as nossas instruções ou,
            quando for o caso, as próprias políticas deles.
        </p>

        <h2>2. Canal de privacidade</h2>
        <p>Para exercer seus direitos ou tirar dúvidas sobre esta política, fale conosco:</p>
        <p>
            E-mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <br />
            Telefone: <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a>
        </p>

        <h2>3. Quais dados tratamos, para quê e com qual base legal</h2>
        <ul>
            <li>
                <strong>Pedidos de contato e orçamento pelo site:</strong> nome, telefone, dados do veículo e
                a mensagem que você escrever, para responder ao pedido e preparar o orçamento (procedimentos
                preliminares a um contrato, a seu pedido). Os formulários e o chat do site não gravam essas
                informações em nosso sistema: elas são montadas em uma mensagem, que só chega até nós se você
                a enviar pelo WhatsApp.
            </li>
            <li>
                <strong>Oficina e guincho:</strong> nome, CPF ou CNPJ, telefone, e-mail, endereço, placa,
                chassi e dados do veículo, fotos e checklist do veículo, origem e destino do transporte,
                assinaturas e histórico de atendimentos, para executar o serviço e emitir documentos
                (execução de contrato e cumprimento de obrigação legal).
            </li>
            <li>
                <strong>Quem entrega ou recebe o veículo:</strong> nome e documento, quando a pessoa não é o
                próprio cliente, para comprovar a entrega e a retirada e proteger o veículo (legítimo
                interesse e exercício regular de direitos).
            </li>
            <li>
                <strong>Consulta pela placa:</strong> a equipe pode consultar dados do veículo em um
                fornecedor especializado, para preencher o cadastro corretamente. Registramos quem fez cada
                consulta, para fins de segurança (legítimo interesse).
            </li>
            <li>
                <strong>Equipe:</strong> dados de login, registros de acesso e consultas no sistema, além de
                custos e comprovantes de viagem, para controlar o acesso, manter a segurança e organizar a
                operação (execução de contrato, obrigação legal e legítimo interesse).
            </li>
            <li>
                <strong>Registros de acesso ao site:</strong> como endereço IP, data e hora, para segurança e
                para cumprir o Marco Civil da Internet (obrigação legal).
            </li>
        </ul>
        <p>
            Não usamos seus dados para tomar decisões totalmente automatizadas sobre você, e não pedimos
            dados sensíveis, como informações de saúde ou religião. Evite incluí-los nas mensagens e nos
            campos de texto. Nossos serviços são contratados por adultos; dados de menores só são tratados
            se forem informados pelo responsável e forem necessários ao atendimento.
        </p>

        <h2>4. Com quem compartilhamos</h2>
        <p>Não vendemos seus dados. Compartilhamos apenas o necessário com:</p>
        <ul>
            <li><strong>WhatsApp (Meta):</strong> mensagens, quando você escolhe falar conosco por lá;</li>
            <li><strong>Vercel e Railway:</strong> hospedagem do site, do sistema e do banco de dados;</li>
            <li><strong>Cloudinary:</strong> armazenamento de fotos de veículos e comprovantes;</li>
            <li>
                <strong>Google:</strong> fontes do site e mapa (se você escolher exibi-lo), que recebem dados
                técnicos da sua conexão, como o IP, e endereços usados no cálculo de rotas do guincho;
            </li>
            <li><strong>APIBrasil:</strong> placa do veículo, para a consulta de dados veiculares;</li>
            <li>
                <strong>Autoridades e profissionais:</strong> contabilidade, assessoria jurídica e órgãos
                públicos, quando necessário ou exigido por lei.
            </li>
        </ul>

        <h2>5. Transferência internacional</h2>
        <p>
            Alguns desses fornecedores têm servidores no exterior, principalmente nos Estados Unidos. Por
            isso, dados das seções 3 e 4 podem ser enviados para fora do Brasil, para hospedar o sistema,
            armazenar fotos, calcular rotas e permitir o atendimento pelo WhatsApp. Isso dura enquanto usarmos
            o fornecedor e os dados precisarem ser mantidos. Essas transferências seguem as regras da LGPD. Você
            pode pedir mais informações pelo nosso canal de privacidade.
        </p>

        <h2>6. Por quanto tempo guardamos</h2>
        <ul>
            <li>
                <strong>Contatos que não viraram serviço:</strong> até deixarem de ser necessários para o
                atendimento.
            </li>
            <li>
                <strong>Cadastro, ordens de serviço e documentos:</strong> em regra, por 5 anos depois do fim
                do serviço, em razão de prazos fiscais e de defesa do consumidor. O prazo pode ser maior se
                houver obrigação legal ou processo em andamento.
            </li>
            <li><strong>Registros de acesso ao site:</strong> pelo prazo legal de 6 meses.</li>
        </ul>
        <p>Depois disso, os dados são eliminados ou anonimizados, salvo se a lei permitir ou exigir mantê-los.</p>

        <h2>7. Cookies e armazenamento no navegador</h2>
        <p>
            Não usamos cookies de publicidade nem de estatísticas. O navegador guarda apenas a sua preferência
            de tema e, para a equipe, a sessão de login. O mapa do Google só carrega se você clicar em
            &quot;Mostrar mapa&quot;; a partir daí, o Google recebe dados da sua conexão e pode usar cookies
            próprios.
        </p>

        <h2>8. Segurança</h2>
        <p>
            Adotamos medidas técnicas e administrativas para proteger os dados, como conexão criptografada,
            senhas protegidas e acesso restrito por função. Nenhum sistema é totalmente imune a falhas. Se
            ocorrer um incidente que possa causar risco ou dano relevante, avisaremos os afetados e a Agência
            Nacional de Proteção de Dados (ANPD), como determina a lei.
        </p>

        <h2>9. Seus direitos</h2>
        <p>Você pode pedir, gratuitamente, pelo nosso canal de privacidade:</p>
        <ul>
            <li>a confirmação de que tratamos seus dados e o acesso a eles;</li>
            <li>a correção de dados incompletos, incorretos ou desatualizados;</li>
            <li>a anonimização, o bloqueio ou a eliminação de dados desnecessários, excessivos ou tratados em desacordo com a lei;</li>
            <li>a portabilidade dos dados, conforme a regulamentação;</li>
            <li>informações sobre com quem compartilhamos seus dados;</li>
            <li>quando o tratamento se basear em consentimento: saber as consequências de não consentir, revogá-lo e pedir a eliminação dos dados;</li>
            <li>a oposição a um tratamento que descumpra a LGPD.</li>
        </ul>
        <p>
            Podemos pedir informações para confirmar a sua identidade. Quando você solicitar uma declaração
            completa sobre seus dados, responderemos em até 15 dias. Alguns dados podem ser mantidos se a lei
            exigir, por exemplo documentos fiscais. Você também pode apresentar reclamação à ANPD.
        </p>

        <h2>10. Alterações</h2>
        <p>
            Podemos atualizar esta política, por exemplo se adotarmos novas ferramentas ou fornecedores. A
            versão em vigor fica sempre nesta página, com a data da última atualização.
        </p>
    </article>
);

export default Privacy;
