import { Env } from './types';
import { routeSocietes } from './routes/societes';
import { routeSalaries } from './routes/salaries';
import { routeRubriques } from './routes/rubriques';
import { routeDossiers } from './routes/dossiers';
import { routeFichesNavette } from './routes/fiches_navette';
import { routeImportsGa } from './routes/imports_ga';
import { routeDashboard } from './routes/dashboard';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
}

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method === 'OPTIONS') return cors();

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // Dashboard
    if (path === '/api/dashboard' && method === 'GET') {
      return json(await routeDashboard(env));
    }

    // Societes
    if (path === '/api/societes' && method === 'GET') {
      return json(await routeSocietes.list(env));
    }
    if (path === '/api/societes' && method === 'POST') {
      return json(await routeSocietes.create(request, env));
    }
    const societeMatch = path.match(/^\/api\/societes\/([^/]+)$/);
    if (societeMatch && method === 'GET') {
      return json(await routeSocietes.get(env, societeMatch[1]));
    }
    if (societeMatch && method === 'PUT') {
      return json(await routeSocietes.update(request, env, societeMatch[1]));
    }
    if (societeMatch && method === 'DELETE') {
      return json(await routeSocietes.remove(env, societeMatch[1]));
    }

    // Salaries
    const salariesMatch = path.match(/^\/api\/societes\/([^/]+)\/salaries$/);
    if (salariesMatch && method === 'GET') {
      return json(await routeSalaries.list(env, salariesMatch[1]));
    }
    if (salariesMatch && method === 'POST') {
      return json(await routeSalaries.create(request, env, salariesMatch[1]));
    }
    const salaryMatch = path.match(/^\/api\/salaries\/([^/]+)$/);
    if (salaryMatch && method === 'PUT') {
      return json(await routeSalaries.update(request, env, salaryMatch[1]));
    }

    // Rubriques
    const rubriquesMatch = path.match(/^\/api\/societes\/([^/]+)\/rubriques$/);
    if (rubriquesMatch && method === 'GET') {
      return json(await routeRubriques.list(env, rubriquesMatch[1]));
    }
    if (rubriquesMatch && method === 'POST') {
      return json(await routeRubriques.upsert(request, env, rubriquesMatch[1]));
    }

    // Dossiers
    const dossiersMatch = path.match(/^\/api\/societes\/([^/]+)\/dossiers$/);
    if (dossiersMatch && method === 'GET') {
      return json(await routeDossiers.list(env, dossiersMatch[1]));
    }
    if (dossiersMatch && method === 'POST') {
      return json(await routeDossiers.create(request, env, dossiersMatch[1]));
    }
    const dossierMatch = path.match(/^\/api\/dossiers\/([^/]+)$/);
    if (dossierMatch && method === 'GET') {
      return json(await routeDossiers.get(env, dossierMatch[1]));
    }

    // Upload fiche navette
    const uploadMatch = path.match(/^\/api\/dossiers\/([^/]+)\/upload$/);
    if (uploadMatch && method === 'POST') {
      return json(await routeFichesNavette.upload(request, env, uploadMatch[1]));
    }

    // Extraction IA
    const extractMatch = path.match(/^\/api\/dossiers\/([^/]+)\/extract$/);
    if (extractMatch && method === 'POST') {
      return json(await routeFichesNavette.extract(env, extractMatch[1]));
    }

    // Lignes extraites
    const lignesMatch = path.match(/^\/api\/dossiers\/([^/]+)\/lignes$/);
    if (lignesMatch && method === 'GET') {
      return json(await routeFichesNavette.lignes(env, lignesMatch[1]));
    }
    const ligneMatch = path.match(/^\/api\/lignes\/([^/]+)$/);
    if (ligneMatch && method === 'PUT') {
      return json(await routeFichesNavette.updateLigne(request, env, ligneMatch[1]));
    }

    // Valider dossier
    const validerMatch = path.match(/^\/api\/dossiers\/([^/]+)\/valider$/);
    if (validerMatch && (method === 'PUT' || method === 'POST')) {
      return json(await routeFichesNavette.valider(env, validerMatch[1]));
    }

    // Export Sage GA
    const exportMatch = path.match(/^\/api\/dossiers\/([^/]+)\/export$/);
    if (exportMatch && method === 'POST') {
      return json(await routeImportsGa.generate(env, exportMatch[1]));
    }
    const exportsMatch = path.match(/^\/api\/dossiers\/([^/]+)\/exports$/);
    if (exportsMatch && method === 'GET') {
      return json(await routeImportsGa.list(env, exportsMatch[1]));
    }
    const downloadMatch = path.match(/^\/api\/exports\/([^/]+)\/download$/);
    if (downloadMatch && method === 'GET') {
      return routeImportsGa.download(env, downloadMatch[1]);
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: any) {
    console.error('API Error:', e.message);
    return json({ error: e.message }, 500);
  }
}
