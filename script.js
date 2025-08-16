// Elementos da interface
const tabs = document.querySelectorAll(".tab");
const calculatorSection = document.getElementById("calculator");
const resultSection = document.getElementById("result");
const calculateBtn = document.getElementById("calculate-btn");
const recalculateBtn = document.getElementById("recalculate-btn");
const saveBtn = document.getElementById("save-btn");
const shareBtn = document.getElementById("share-btn");
const carbonValue = document.querySelector(".carbon-value");
const treesValue = document.getElementById("trees-value");
const gasolineValue = document.getElementById("gasoline-value");
const tripsValue = document.getElementById("trips-value");
const carbonProgress = document.getElementById("carbon-progress");
const tipsList = document.getElementById("tips-list");

// Variáveis globais
let contributionChart = null;

// Fatores de emissão por região (kg CO2/kWh)
const regionFactors = {
  sul: 0.08, // Predominância de hidrelétricas
  sudeste: 0.1, // Mistura de hidrelétricas e termelétricas
  centro: 0.2, // Mais termelétricas
  nordeste: 0.3, // Alta dependência de termelétricas
  norte: 0.35, // Alta dependência de termelétricas
};

// Fatores de emissão por tipo de combustível (kg CO2/km)
const fuelFactors = {
  gasoline: 0.192,
  ethanol: 0.138,
  diesel: 0.171,
  flex: 0.165,
  eletric: 0.0, // Será calculado baseado na matriz energética
  hybrid: 0.1, // Média entre elétrico e gasolina
};

const dietFactors = {
  "high-all": 2.3, // Alto consumo de todos os tipos de carne
  "high-red": 2.5, // Foco em carne vermelha (maior impacto)
  "medium-mixed": 1.8, // Consumo misto moderado
  "low-fish": 1.2, // Principalmente peixe (menor impacto entre carnes)
  vegetarian: 0.9, // Vegetariano
  vegan: 0.6, // Vegano
};

// Ativar seleção de opções de dieta
document.querySelectorAll(".diet-option").forEach((option) => {
  option.addEventListener("click", function () {
    // Remover seleção anterior
    document.querySelectorAll(".diet-option").forEach((opt) => {
      opt.classList.remove("selected");
    });

    // Adicionar seleção atual
    this.classList.add("selected");

    // Atualizar valor oculto
    const value = this.getAttribute("data-value");
    document.getElementById("diet").value = value;
  });
});

// Inicializar com opção selecionada
document
  .querySelector('.diet-option[data-value="medium-mixed"]')
  .classList.add("selected");

// Dicas de redução
const reductionTips = [
  "Reduza seu uso de carro em 20%: -0.8 ton CO₂/ano",
  "Troque lâmpadas por LED: -0.2 ton CO₂/ano",
  "Reduza consumo de carne para 3x/semana: -0.5 ton CO₂/ano",
  "Desligue eletrônicos em standby: -0.1 ton CO₂/ano",
  "Use transporte público 2x por semana: -0.4 ton CO₂/ano",
  "Instale painéis solares: -0.7 ton CO₂/ano",
  "Plante uma árvore por mês: -0.15 ton CO₂/ano",
];

// Função para calcular a pegada de carbono
function calculateCarbonFootprint() {
  // Obter valores dos campos
  const region = document.getElementById("region").value;
  const transport = parseFloat(document.getElementById("transport").value) || 0;
  const fuelType = document.getElementById("fuel-type").value;
  const energy = parseFloat(document.getElementById("energy").value) || 0;
  const diet = document.getElementById("diet").value;

  // Fator de energia baseado na região
  const energyFactor = regionFactors[region];

  // Cálculos
  const transportEmissions = (transport * fuelFactors[fuelType] * 365) / 1000; // ton/ano
  const energyEmissions = (energy * energyFactor * 12) / 1000; // ton/ano
  const dietEmissions = dietFactors[diet];

  return {
    total: transportEmissions + energyEmissions + dietEmissions,
    transport: transportEmissions,
    energy: energyEmissions,
    diet: dietEmissions,
  };
}

// Atualizar a interface com os resultados
function updateResults() {
  const results = calculateCarbonFootprint();
  const footprint = results.total;

  // Atualizar valor principal
  carbonValue.textContent = footprint.toFixed(1) + " ton CO₂";

  // Atualizar barra de progresso (comparação com média brasileira)
  const progressPercentage = Math.min((footprint / 5) * 100, 100);
  carbonProgress.style.width = progressPercentage + "%";

  // Cálculos comparativos
  const trees = Math.round((footprint * 1000) / 15); // 15 kg CO2/árvore/ano
  const gasoline = Math.round((footprint * 1000) / 2.3); // 2.3 kg CO2/litro gasolina
  const trips = Math.round(gasoline / 80); // 80 litros por viagem SP-Rio

  treesValue.textContent = trees;
  gasolineValue.textContent = gasoline.toLocaleString() + "L";
  tripsValue.textContent = trips;

  // Atualizar gráfico de contribuição
  updateContributionChart(results);

  // Atualizar dicas de redução
  updateReductionTips(footprint);
}

// Atualizar gráfico de contribuição
function updateContributionChart(results) {
  const ctx = document.getElementById("contribution-chart").getContext("2d");

  // Destruir gráfico anterior se existir
  if (contributionChart) {
    contributionChart.destroy();
  }

  // Criar novo gráfico
  contributionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Transporte", "Energia", "Alimentação"],
      datasets: [
        {
          data: [results.transport, results.energy, results.diet],
          backgroundColor: ["#3498db", "#f1c40f", "#e74c3c"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.toFixed(1)} ton CO₂`;
            },
          },
        },
      },
    },
  });
}

// Atualizar dicas de redução
function updateReductionTips(footprint) {
  tipsList.innerHTML = "";

  // Selecionar 4 dicas aleatórias
  const selectedTips = getRandomTips(4);

  selectedTips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipsList.appendChild(li);
  });
}

// Selecionar dicas aleatórias
function getRandomTips(count) {
  const shuffled = [...reductionTips].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Event Listeners
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // Remover classe ativa de todas as tabs
    tabs.forEach((t) => t.classList.remove("active"));
    // Adicionar classe ativa à tab clicada
    tab.classList.add("active");

    // Mostrar a seção correspondente
    const target = tab.getAttribute("data-target");
    calculatorSection.classList.remove("active");
    resultSection.classList.remove("active");

    if (target === "calculator") {
      calculatorSection.classList.add("active");
    } else if (target === "result") {
      resultSection.classList.add("active");
    }
  });
});

calculateBtn.addEventListener("click", () => {
  // Validar campos obrigatórios
  const transport = document.getElementById("transport").value;
  const energy = document.getElementById("energy").value;

  if (!transport || !energy) {
    alert("Por favor, preencha todos os campos obrigatórios.");
    return;
  }

  // Atualizar resultados
  updateResults();

  // Mudar para a aba de resultados
  tabs.forEach((t) => t.classList.remove("active"));
  tabs[1].classList.add("active");
  calculatorSection.classList.remove("active");
  resultSection.classList.add("active");
});

recalculateBtn.addEventListener("click", () => {
  // Mudar para a aba de cálculo
  tabs.forEach((t) => t.classList.remove("active"));
  tabs[0].classList.add("active");
  calculatorSection.classList.add("active");
  resultSection.classList.remove("active");
});

saveBtn.addEventListener("click", () => {
  alert(
    "Resultado salvo com sucesso! Esta funcionalidade pode ser integrada a um banco de dados em uma versão completa."
  );
});

shareBtn.addEventListener("click", () => {
  alert(
    "Compartilhe sua pegada de carbono nas redes sociais para conscientizar outras pessoas!"
  );
});

// Inicialização com valores padrão
document.getElementById("transport").value = 20;
document.getElementById("energy").value = 150;

// Inicializar gráfico vazio
updateContributionChart({
  total: 0,
  transport: 0,
  energy: 0,
  diet: 0,
});
