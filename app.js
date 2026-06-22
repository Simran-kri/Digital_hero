const OWNER = {
  name: "Simran Kumari",
  email: "yadavsimran95126@gmail.com",
};

const amountInput = document.querySelector("#amount");
const rateInput = document.querySelector("#rate");
const tenureInput = document.querySelector("#tenure");
const extraInput = document.querySelector("#extra");
const emiOutput = document.querySelector("#emi");
const interestOutput = document.querySelector("#interest");
const totalOutput = document.querySelector("#total");
const interestShareOutput = document.querySelector("#interest-share");
const payoffNote = document.querySelector("#payoff-note");
const amortizationBody = document.querySelector("#amortization-body");
const canvas = document.querySelector("#balance-chart");
const context = canvas.getContext("2d");

document.querySelector("#owner-name").textContent = OWNER.name;
document.querySelector("#owner-email").textContent = OWNER.email;
document.querySelector("#owner-email").href = `mailto:${OWNER.email}`;

const formatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
});

function currency(value) {
  return `Rs. ${formatter.format(Math.round(value))}`;
}

function parseInput(input) {
  return Number.parseFloat(input.value) || 0;
}

function calculateEmi(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  const compound = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * compound) / (compound - 1);
}

function buildSchedule(principal, annualRate, months, emi) {
  const monthlyRate = annualRate / 100 / 12;
  let balance = principal;
  const rows = [];
  let totalPrincipal = 0;
  let totalInterest = 0;

  for (let month = 1; month <= months && balance > 0.01; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(emi - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    totalPrincipal += principalPaid;
    totalInterest += interest;

    if (month % 12 === 0 || month === months || balance <= 0.01) {
      const previous = rows[rows.length - 1];
      rows.push({
        year: Math.ceil(month / 12),
        principalPaid: totalPrincipal - (previous?.principalToDate || 0),
        interestPaid: totalInterest - (previous?.interestToDate || 0),
        principalToDate: totalPrincipal,
        interestToDate: totalInterest,
        balance,
      });
    }
  }

  return {
    rows,
    totalInterest,
    totalPayment: principal + totalInterest,
    payoffMonths: Math.ceil(rows.at(-1)?.year * 12 || 0),
  };
}

function drawChart(rows, principal) {
  const width = canvas.width;
  const height = canvas.height;
  const padding = 34;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fbfcff";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#d8dde6";
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding + (chartHeight / 4) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  if (!rows.length || principal <= 0) {
    return;
  }

  const points = [{ year: 0, balance: principal }, ...rows];
  const denominator = Math.max(points.length - 1, 1);

  context.beginPath();
  points.forEach((point, index) => {
    const x = padding + (chartWidth / denominator) * index;
    const y = padding + chartHeight - (point.balance / principal) * chartHeight;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.strokeStyle = "#2458d6";
  context.lineWidth = 4;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  points.forEach((point, index) => {
    const x = padding + (chartWidth / denominator) * index;
    const y = padding + chartHeight - (point.balance / principal) * chartHeight;
    context.fillStyle = "#147d64";
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  });
}

function renderRows(rows) {
  amortizationBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>Year ${row.year}</td>
          <td>${currency(row.principalPaid)}</td>
          <td>${currency(row.interestPaid)}</td>
          <td>${currency(row.balance)}</td>
        </tr>
      `,
    )
    .join("");
}

function updateCalculator() {
  const amount = parseInput(amountInput);
  const extraPayment = Math.min(parseInput(extraInput), amount);
  const principal = Math.max(0, amount - extraPayment);
  const annualRate = parseInput(rateInput);
  const months = Math.max(1, Math.round(parseInput(tenureInput) * 12));
  const emi = calculateEmi(principal, annualRate, months);
  const schedule = buildSchedule(principal, annualRate, months, emi);
  const interestShare = schedule.totalPayment > 0 ? (schedule.totalInterest / schedule.totalPayment) * 100 : 0;

  emiOutput.textContent = currency(emi);
  interestOutput.textContent = currency(schedule.totalInterest);
  totalOutput.textContent = currency(schedule.totalPayment + extraPayment);
  interestShareOutput.textContent = `${percentFormatter.format(interestShare)}%`;
  payoffNote.textContent = extraPayment
    ? `${currency(extraPayment)} paid upfront, EMI calculated on ${currency(principal)}.`
    : "Based on the current inputs.";

  renderRows(schedule.rows);
  drawChart(schedule.rows, principal);
}

[amountInput, rateInput, tenureInput, extraInput].forEach((input) => {
  input.addEventListener("input", updateCalculator);
});

updateCalculator();
