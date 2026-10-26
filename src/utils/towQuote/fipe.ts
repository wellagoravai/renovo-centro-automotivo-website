// Tabela FIPE pública (sem autenticação) — usada só para preencher as listas de
// marca/modelo do check-in. Chamada direta via fetch (não usa o `api` interno)
// porque é um domínio de terceiros e não deve receber o Bearer token do usuário.
const FIPE_BASE_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

export interface FipeOption {
  codigo: string;
  nome: string;
}

export async function fetchFipeBrands(): Promise<FipeOption[]> {
  const response = await fetch(`${FIPE_BASE_URL}/marcas`);
  if (!response.ok) throw new Error('Não foi possível carregar a lista de marcas.');
  return response.json();
}

export async function fetchFipeModels(brandCode: string): Promise<FipeOption[]> {
  const response = await fetch(`${FIPE_BASE_URL}/marcas/${brandCode}/modelos`);
  if (!response.ok) throw new Error('Não foi possível carregar a lista de modelos.');
  const data = await response.json();
  return data.modelos ?? [];
}
