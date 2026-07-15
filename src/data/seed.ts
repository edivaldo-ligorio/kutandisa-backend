import bcrypt from 'bcryptjs';
import { db, initSchema } from '../db.js';

const destinations = [
  {
    name: 'Miradouro da Lua', province: 'Luanda', category: 'Natureza', rating: 4.8, reviews: 312,
    price: '25.000–75.000 Kz',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80','https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80','https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80'],
    lat: -9.2765, lng: 13.1480,
    description: 'O Miradouro da Lua é uma das maravilhas naturais mais impressionantes de Angola, localizado a cerca de 40 km ao sul de Luanda. As suas formações rochosas erodidas pela chuva e pelo vento ao longo de milhões de anos criam uma paisagem lunar única, com vales profundos e picos aguçados em tons de ocre, vermelho e bege.',
    highlights: ['Formações rochosas únicas', 'Por do sol espectacular', 'Fotografias panorâmicas', 'Guia local incluído'],
    bestTime: 'Maio a Outubro', duration: '2–4 horas', difficulty: 'Fácil',
  },
  {
    name: 'Cataratas de Kalandula', province: 'Malanje', category: 'Natureza', rating: 4.9, reviews: 287,
    price: '40.000–100.000 Kz',
    image: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800&q=80','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'],
    lat: -9.0669, lng: 16.0028,
    description: 'As Cataratas de Kalandula são uma das maiores e mais belas cascatas de África, com cerca de 105 metros de altura e 400 metros de largura. O Rio Lucala precipita-se em toda a sua majestade criando uma cortina de água e névoa permanente que alimenta uma vegetação exuberante em redor.',
    highlights: ['Uma das maiores cataratas de África', 'Vegetação tropical luxuriante', 'Banhos naturais permitidos', 'Caminhadas nas margens'],
    bestTime: 'Fevereiro a Abril', duration: '1 dia completo', difficulty: 'Moderado',
  },
  {
    name: 'Ilha do Mussulo', province: 'Luanda', category: 'Praia', rating: 4.7, reviews: 445,
    price: '30.000–90.000 Kz',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80','https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80','https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80'],
    lat: -9.0000, lng: 13.1800,
    description: 'A Ilha do Mussulo é uma península de areia fina e águas cristalinas a poucos quilómetros de Luanda. Destino preferido dos luandenses para fins de semana, oferece restaurantes de marisco, desportos náuticos, passeios de barco e praias de rara beleza com palmeiras.',
    highlights: ['Praias de areia branca', 'Marisco fresco', 'Desportos náuticos', 'Passeios de barco ao pôr do sol'],
    bestTime: 'Todo o ano', duration: '1–2 dias', difficulty: 'Fácil',
  },
  {
    name: 'Parque Nacional do Iona', province: 'Namibe', category: 'Natureza', rating: 4.6, reviews: 198,
    price: '50.000–150.000 Kz',
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80','https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80','https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80'],
    lat: -16.7000, lng: 12.2000,
    description: 'O Parque Nacional do Iona é o maior de Angola e um dos mais antigos de África, abrangendo mais de 15.000 km² de deserto do Namibe. Abriga fauna rara como elefantes do deserto, leões, zebras e oryxes que se adaptaram a este ambiente extremo de beleza surreal.',
    highlights: ['Maior parque de Angola', 'Fauna rara do deserto', 'Dunas gigantes', 'Céu estrelado sem poluição luminosa'],
    bestTime: 'Junho a Setembro', duration: '3–5 dias', difficulty: 'Exigente',
  },
  {
    name: 'Baía dos Tigres', province: 'Namibe', category: 'Praia', rating: 4.5, reviews: 134,
    price: '45.000–125.000 Kz',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80','https://images.unsplash.com/photo-1476673160081-cf065607f449?w=800&q=80','https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80'],
    lat: -16.5900, lng: 11.7700,
    description: 'A Baía dos Tigres é uma das praias mais remotas e selvagens de Angola — uma ilha-banco de areia praticamente desabitada, onde o deserto do Namibe encontra o Oceano Atlântico. Uma experiência para viajantes aventureiros que procuram paisagens intocadas.',
    highlights: ['Praia virgem e isolada', 'Colónias de pelicanos', 'Pesca de alto mar', 'Pôr do sol no deserto'],
    bestTime: 'Julho a Setembro', duration: '2–3 dias', difficulty: 'Moderado',
  },
  {
    name: 'Pungo Andongo', province: 'Malanje', category: 'História', rating: 4.7, reviews: 221,
    price: '35.000–90.000 Kz',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80','https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80','https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80'],
    lat: -9.6833, lng: 15.5833,
    description: 'Pungo Andongo, também conhecido como Pedras Negras de Pungo Andongo, é um conjunto de formações rochosas graníticas de enorme valor histórico e cultural. Foi a última capital do Reino do Ndongo e local de resistência da rainha Nzinga contra os portugueses no século XVII.',
    highlights: ['História do Reino do Ndongo', 'Pegadas da Rainha Nzinga', 'Formações rochosas únicas', 'Guias especializados em história'],
    bestTime: 'Maio a Outubro', duration: '1 dia', difficulty: 'Fácil',
  },
  {
    name: 'Luanda Waterfront', province: 'Luanda', category: 'Cidade', rating: 4.4, reviews: 567,
    price: '15.000–50.000 Kz',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80','https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80','https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80'],
    lat: -8.8368, lng: 13.2344,
    description: 'A Marginal de Luanda é o coração pulsante da capital angolana. Uma avenida ribeirinha renovada com jardins, restaurantes, museus e uma vista deslumbrante sobre a Baía de Luanda. O lugar perfeito para sentir o ritmo da vida luandense, com animação noturna e eventos culturais frequentes.',
    highlights: ['Museu Nacional da Escravatura', 'Restaurantes de cozinha angolana', 'Mercado de artesanato', 'Vista sobre a baía'],
    bestTime: 'Todo o ano', duration: '3–6 horas', difficulty: 'Fácil',
  },
  {
    name: 'Quedas do Ruacaná', province: 'Cunene', category: 'Natureza', rating: 4.8, reviews: 176,
    price: '60.000–175.000 Kz',
    image: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800&q=80','https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80'],
    lat: -17.4167, lng: 14.2167,
    description: 'As Quedas do Ruacaná formam-se quando o Rio Cunene, na fronteira entre Angola e a Namíbia, despenca numa queda espectacular de 120 metros de altura. Na época das chuvas, o volume de água é avassalador e a névoa criada pode ser vista a quilómetros de distância.',
    highlights: ['120 metros de queda livre', 'Fronteira natural Angola-Namíbia', 'Flora e fauna endémica', 'Fotografia de paisagem'],
    bestTime: 'Janeiro a Março', duration: '1–2 dias', difficulty: 'Moderado',
  },
  {
    name: 'Benguela Colonial', province: 'Benguela', category: 'História', rating: 4.5, reviews: 243,
    price: '25.000–75.000 Kz',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80','https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80','https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80'],
    lat: -12.5762, lng: 13.4078,
    description: 'Benguela é uma cidade portuária com um rico centro histórico colonial preservado, praias tranquilas e uma gastronomia única. Conhecida pelo seu clima ameno, pela famosa Linha do Caminho de Ferro de Benguela e por ser a porta de entrada para as praias do Lobito e do Baia Farta.',
    highlights: ['Arquitectura colonial portuguesa', 'Caminho de Ferro histórico', 'Praias de Lobito', 'Gastronomia de peixe e marisco'],
    bestTime: 'Junho a Outubro', duration: '2–3 dias', difficulty: 'Fácil',
  },
];

function seed() {
  initSchema();

  const countRow = db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number };
  if (countRow.n > 0) {
    console.log('A base de dados já contém dados. Seed ignorado (apaga o ficheiro .db para recomeçar).');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status, joined, avatar)
    VALUES (@name, @email, @password_hash, @role, @status, @joined, @avatar)
  `);

  const users = [
    { name: 'Maria João', email: 'maria@kutandisa.ao', password: '123456', role: 'client', status: 'active', joined: '2026-01-15', avatar: 'MJ' },
    { name: 'Hotel Luanda', email: 'hotel@kutandisa.ao', password: 'hotel123', role: 'operator', status: 'active', joined: '2025-06-15', avatar: 'HL' },
    { name: 'Admin Kutandisa', email: 'admin@kutandisa.ao', password: 'admin123', role: 'admin', status: 'active', joined: '2025-01-01', avatar: 'AK' },
  ];

  const userIds: Record<string, number> = {};
  for (const u of users) {
    const info = insertUser.run({
      name: u.name,
      email: u.email,
      password_hash: bcrypt.hashSync(u.password, 10),
      role: u.role,
      status: u.status,
      joined: u.joined,
      avatar: u.avatar,
    });
    userIds[u.role] = Number(info.lastInsertRowid);
  }

  db.prepare(`
    INSERT INTO operators (user_id, name, email, category, status, services, rating, joined, revenue)
    VALUES (@user_id, @name, @email, @category, @status, @services, @rating, @joined, @revenue)
  `).run({
    user_id: userIds.operator,
    name: 'Hotel Luanda',
    email: 'hotel@kutandisa.ao',
    category: 'Alojamento',
    status: 'active',
    services: 4,
    rating: 4.6,
    joined: '2025-06-15',
    revenue: 0,
  });

  const insertDest = db.prepare(`
    INSERT INTO destinations (name, province, category, rating, reviews, price, image, images, lat, lng, description, highlights, bestTime, duration, difficulty)
    VALUES (@name, @province, @category, @rating, @reviews, @price, @image, @images, @lat, @lng, @description, @highlights, @bestTime, @duration, @difficulty)
  `);
  const destIds: number[] = [];
  for (const d of destinations) {
    const info = insertDest.run({
      ...d,
      images: JSON.stringify(d.images),
      highlights: JSON.stringify(d.highlights),
    });
    destIds.push(Number(info.lastInsertRowid));
  }

  console.log('Seed concluído: 3 utilizadores, 9 destinos. Sem reservas nem pagamentos fictícios.');
  console.log('Credenciais demo:');
  console.log('  Cliente  -> maria@kutandisa.ao / 123456');
  console.log('  Operador -> hotel@kutandisa.ao / hotel123');
  console.log('  Admin    -> admin@kutandisa.ao / admin123');
}

seed();
