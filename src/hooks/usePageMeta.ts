import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://renovoautoeguincho.com.br';

// Cada página pública aponta para o próprio endereço. Um canonical fixo no
// index.html faria o Google tratar todas elas como cópias da página inicial.
export const useCanonical = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = `${SITE_URL}${pathname}`;
        document.head.appendChild(link);
        return () => link.remove();
    }, [pathname]);
};

// Título e descrição próprios da página; ao sair dela, voltam os do index.html.
export const usePageMeta = (title: string, description: string) => {
    useEffect(() => {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        const previousTitle = document.title;
        const previousDescription = meta?.content;

        document.title = title;
        if (meta) meta.content = description;

        return () => {
            document.title = previousTitle;
            if (meta && previousDescription !== undefined) meta.content = previousDescription;
        };
    }, [title, description]);
};
