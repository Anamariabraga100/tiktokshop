// Dados de teste para desenvolvimento
// Use apenas em ambiente de desenvolvimento/teste

export const generateTestCustomerData = () => {
  // CPF válido de teste (não é um CPF real, apenas para testes)
  const testCPF = '12345678909'; // CPF de teste válido
  
  // Nomes aleatórios para teste
  const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Fernando', 'Beatriz'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  
  // Email de teste
  const email = `teste${Math.floor(Math.random() * 10000)}@exemplo.com`;
  
  // Telefone de teste
  const phone = `119${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
  
  return {
    name: fullName,
    email: email,
    phone: phone,
    cpf: testCPF,
    address: {
      cep: '01310-100',
      rua: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 101',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    },
  };
};

// Dados fixos de teste (mais fácil para debug)
export const TEST_CUSTOMER_DATA = {
  name: 'João da Silva',
  email: 'joao.silva@exemplo.com',
  phone: '11987654321',
  cpf: '12345678909',
  address: {
    cep: '01310-100',
    rua: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Apto 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
  },
};

