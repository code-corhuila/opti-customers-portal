/**
 * Colombia departments and their main municipalities, for the city picker (department narrows the
 * list of cities; only the city name is sent to the service — department is a UI filter, not a
 * stored field). Not exhaustive: the department capital plus the best-known municipalities.
 */
export const COLOMBIA: { department: string; cities: string[] }[] = [
  { department: 'Amazonas', cities: ['Leticia', 'Puerto Nariño'] },
  { department: 'Antioquia', cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Apartadó', 'Turbo'] },
  { department: 'Arauca', cities: ['Arauca', 'Saravena', 'Tame'] },
  { department: 'Atlántico', cities: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'] },
  { department: 'Bogotá D.C.', cities: ['Bogotá'] },
  { department: 'Bolívar', cities: ['Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar'] },
  { department: 'Boyacá', cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá'] },
  { department: 'Caldas', cities: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría'] },
  { department: 'Caquetá', cities: ['Florencia', 'San Vicente del Caguán'] },
  { department: 'Casanare', cities: ['Yopal', 'Aguazul', 'Villanueva'] },
  { department: 'Cauca', cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'] },
  { department: 'Cesar', cities: ['Valledupar', 'Aguachica', 'Bosconia'] },
  { department: 'Chocó', cities: ['Quibdó', 'Istmina', 'Tadó'] },
  { department: 'Córdoba', cities: ['Montería', 'Lorica', 'Cereté', 'Sahagún'] },
  { department: 'Cundinamarca', cities: ['Soacha', 'Zipaquirá', 'Chía', 'Facatativá', 'Fusagasugá', 'Girardot'] },
  { department: 'Guainía', cities: ['Inírida'] },
  { department: 'Guaviare', cities: ['San José del Guaviare'] },
  { department: 'Huila', cities: ['Neiva', 'Pitalito', 'Garzón', 'La Plata'] },
  { department: 'La Guajira', cities: ['Riohacha', 'Maicao', 'Uribia'] },
  { department: 'Magdalena', cities: ['Santa Marta', 'Ciénaga', 'Fundación'] },
  { department: 'Meta', cities: ['Villavicencio', 'Acacías', 'Granada'] },
  { department: 'Nariño', cities: ['Pasto', 'Ipiales', 'Tumaco'] },
  { department: 'Norte de Santander', cities: ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'] },
  { department: 'Putumayo', cities: ['Mocoa', 'Puerto Asís', 'Orito'] },
  { department: 'Quindío', cities: ['Armenia', 'Calarcá', 'Montenegro'] },
  { department: 'Risaralda', cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'] },
  { department: 'San Andrés y Providencia', cities: ['San Andrés', 'Providencia'] },
  { department: 'Santander', cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'] },
  { department: 'Sucre', cities: ['Sincelejo', 'Corozal', 'Sampués'] },
  { department: 'Tolima', cities: ['Ibagué', 'Espinal', 'Melgar', 'Líbano'] },
  { department: 'Valle del Cauca', cities: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Cartago', 'Buga'] },
  { department: 'Vaupés', cities: ['Mitú'] },
  { department: 'Vichada', cities: ['Puerto Carreño'] },
];

export function departmentOf(city: string): string | null {
  const found = COLOMBIA.find((d) => d.cities.includes(city));
  return found ? found.department : null;
}
