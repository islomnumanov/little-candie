const uuid = require("uuid");
const moment = require("moment");

/////////////////////-----------Everything related to Expenses Array------------////////////////////
// generate an empty expenses array
let expenses = [];

// load data from the local storage
const loadExpenses = () => {
  const expensesJSON = localStorage.getItem("expenses");
  try {
    return expensesJSON ? JSON.parse(expensesJSON) : [];
  } catch (e) {
    return [];
  }
};

// load data from the database
const loadExpensesDB = async () => {
  const response = await fetch("http://localhost:3080/getexp", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  try {
    const result = await response.json();
    console.log(result);
    return result;
  } catch (error) {
    console.log("err", error);
  }
};

// save expenses into the local storage
const saveExpenses = () => {
  localStorage.setItem("expenses", JSON.stringify(expenses));
};

// save expenses into the database
const saveExpensesDB = async () => {
  const rawResponse = await fetch("http://localhost:3080/getexp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expenses),
  });
  const content = await rawResponse.json();

  console.log(content);
};

// expose notes from module
const getExpenses = () => expenses;

// push a new object into the expenses array
const createExpense = () => {
  getSession();
  const id = uuid.v4();
  const timestamp = moment().valueOf();
  const currentSessionID = session.sessionID;
  const getUser = localStorage.getItem("user");
  console.log("getUser", getUser);
  expenses.push({
    sessionID: session.sessionID,
    id: id,
    amount: "",
    description: "",
    user: getUser,
    createdAt: timestamp,
    updatedAt: timestamp,
    sessionID: currentSessionID,
  });
  saveExpenses();
  return id;
};

// getSortedExpenses: sort expenses by latest
const getSortedExpenses = () => {
  const expenses = getExpenses();
  return expenses.sort((a, b) => {
    if (a.updatedAt > b.updatedAt) {
      return -1;
    } else if (a.updatedAt < b.updatedAt) {
      return 1;
    } else {
      return 0;
    }
  });
};

// update function for an individual expense
const updateExpenses = (id, updates) => {
  const expense = expenses.find((expense) => expense.id === id);

  if (!expense) {
    return;
  }

  if (typeof updates.amount === "string") {
    expense.amount = updates.amount;
    expense.updatedAt = moment().valueOf();
  }

  if (typeof updates.description === "string") {
    expense.description = updates.description;
    expense.updatedAt = moment().valueOf();
  }

  saveExpenses();
  return expense;
};

// remove function for an individual expense
const removeExpense = (id) => {
  const expenseIndex = expenses.findIndex((expense) => expense.id === id);
  if (expenseIndex > -1) {
    expenses.splice(expenseIndex, 1);
    saveExpenses();
  }
};

expenses = loadExpenses();

/////////////////////////////////////////////////////////////////////////////////////////////////////

// generate the DOM structure for each expense
const generateDOM = (expense) => {
  const expenseEl = document.createElement("a");
  const amountEl = document.createElement("p");
  const descriptionEl = document.createElement("p");

  // add classes to generated tags
  expenseEl.classList.add("expense-a-tag");
  amountEl.classList.add("expense-p-tag");
  descriptionEl.classList.add("expense-p-tag");

  // setup the expense amount text
  if (expense.amount.length > 0) {
    amountEl.textContent = `${formatCurr(expense.amount)}`;
  } else {
    amountEl.textContent = "Amount Not Given";
  }
  amountEl.classList.add("list-item__title");
  expenseEl.appendChild(amountEl);

  // setup the link
  expenseEl.setAttribute("href", `edit.html#${expense.id}`);
  expenseEl.classList.add("list-item");

  // setup the description
  if (expense.description.length > 0) {
    descriptionEl.textContent = expense.description;
  } else {
    descriptionEl.textContent = "Description Not Given";
  }
  descriptionEl.classList.add("list-item__subtitle");
  expenseEl.appendChild(descriptionEl);

  return expenseEl;
};

// render application expenses
const renderExpense = (uniqueToken) => {
  let expensesElDavid;
  let expensesElJustin;
  if (uniqueToken) {
    expensesElDavid = document.querySelector("#expenses");

    expensesElJustin = document.querySelector("#expensesJ");
  } else {
    alert("wrong password");
  }

  // Depending on the user id enable/disable click on expense divs
  if (uniqueToken === "david") {
    expensesElJustin.style.pointerEvents = "none";
  } else if (uniqueToken === "justin") {
    expensesElDavid.style.pointerEvents = "none";
  }

  const expenses = getSortedExpenses();

  // sort expenses by user
  const { justinExpenses, davidExpenses } = sortExpensesByUser();

  if (davidExpenses.length > 0) {
    davidExpenses.forEach((davidExpenses) => {
      const expenseElDavid = generateDOM(davidExpenses);

      expensesElDavid.appendChild(expenseElDavid);
    });
  } else {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No expenses to show";
    emptyMessage.classList.add("empty-message");
    expensesElDavid.appendChild(emptyMessage);
  }
  if (justinExpenses.length > 0) {
    justinExpenses.forEach((justinExpenses) => {
      const expenseElJustin = generateDOM(justinExpenses);
      expensesElJustin.appendChild(expenseElJustin);
    });
  } else {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No expenses to show";
    emptyMessage.classList.add("empty-message");
    expensesElJustin.appendChild(emptyMessage);
  }
};

// initializedEditPage function
const initializedEditPage = (id) => {
  const amountEl = document.querySelector("#amountD");
  const descriptionEl = document.querySelector("#descriptionD");
  expenses = getExpenses();
  const expense = expenses.find((expense) => expense.id === id);

  if (!expense) {
    location.assign("/index.html");
  }

  amountEl.value = expense.amount;
  descriptionEl.value = expense.description;
};

const sortExpensesByUser = () => {
  const o = { davidExpenses: [], justinExpenses: [] };
  expenses.forEach((e) => {
    if (e.user === "david") {
      o.davidExpenses.push(e);
    } else o.justinExpenses.push(e);
  });
  return o;
};

// getCurrentTotal: checks the current session id and for all expenses that include current session id for a given argument {user} returns total.

const getCurrentTotal = (userToken) => {
  const currentSessionID = getSession().sessionID;
  console.log(currentSessionID);
  const expenses = getExpenses();
  let totalUserExpense = 0;

  expenses.forEach((expense) => {
    if (expense.sessionID === currentSessionID && expense.user === userToken) {
      totalUserExpense += parseInt(expense.amount);
    } else {
      return totalUserExpense;
    }
  });
  return totalUserExpense;
};

// format currency
const formatCurr = (v) => {
  const fmtCurr = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  });
  return fmtCurr.format(v);
};

/////////////////////////////////////////////// ------- Session Functions ------- ////////////////////////////////////////////////////////////

// create a session
let session = {};

// getSession: exposes a current session object
const getSession = () => session;

// saveSession: saves the given current session into the localStorage
const saveSession = () => [
  localStorage.setItem("session", JSON.stringify(session)),
];

// createSession: create a new session object
const createSession = () => {
  const ID = uuid.v4();
  session.sessionID = ID;
  session.davidComplete = false;
  session.justinComplete = false;
  session.sessionComplete = false;
  saveSession();
  return session;
};

// renderCurrentSession: checks if there is an existing session in the local storage. If yes, pass. If no, calls createSession
const renderCurrentSession = () => {
  const sessionJSON = localStorage.getItem("session");
  try {
    return sessionJSON ? JSON.parse(sessionJSON) : createSession();
  } catch (e) {
    createSession();
  }
};

session = renderCurrentSession();

///////////////////////////////////////////// ------------- Session / MongoDB ------------ ///////////////////////////////////////////////////////////////////

// initialize the session
let sessionDB = {};

// getSessionDB: exposes a current session object
const getSessionDB = () => sessionDB;

// saveSessionDB: takes the current session and sends it to the backend
const saveSessionDB = async () => {
  await fetch("http://localhost:3080/session/saveSessionDB", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionDB),
  });
};

// saveSessionDB();

// createSessionDB: does not take argument, just sends a request to the backend
const createSessionDB = async () => {
  const result = await fetch("http://localhost:3080/session/createSessionDB", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      davidComplete: false,
      justinComplete: false,
      sessionComplete: false,
    }),
  });
  const data = await result.json();
  return data;
};

// createSessionDB();

// renderCurrentSessionDB: sends a get request to the DB and brings the latest session from there
const renderCurrentSessionDB = async () => {
  const result = await fetch(
    "http://localhost:3080/session/renderCurrentSessionDB",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        davidComplete: false,
        justinComplete: false,
        sessionComplete: false,
      }),
    }
  );
  const sessionDB = await result.json();
  return sessionDB;
};

renderCurrentSessionDB().then((session) => {
  sessionDB = session;
  console.log(sessionDB);
});

///////////////////////////////////////////// --------- Difference Functions --------- ///////////////////////////////////////////////////////////////
// calculateDifference
const calculateDifference = (a, b) => {
  if (a > b) {
    return a - b;
  } else if (a < b) {
    return b - a;
  } else {
    return 0;
  }
};

/////////////////////////////////////////// ----------- Reconciliation Functions ------------- //////////////////////////////////////////////////////////////

// reconcileBalanceD: reconciles david's balance
const reconcileBalanceD = () => {
  const currentSession = getSession();
  console.log(currentSession);
  if (!currentSession.justinComplete) {
    currentSession.davidComplete = true;
    saveSession();
  } else if (currentSession.justinComplete) {
    currentSession.davidComplete = true;
    currentSession.sessionComplete = true;
    saveSession();
    createSession();
  }
};

// reconcileBalanceJ: reconciles justin's balance
const reconcileBalanceJ = () => {
  const currentSession = getSession();
  console.log(currentSession);
  if (!currentSession.davidComplete) {
    currentSession.justinComplete = true;
    saveSession();
  } else if (currentSession.davidComplete) {
    currentSession.justinComplete = true;
    currentSession.sessionComplete = true;
    saveSession();
    createSession();
  }
};

//////////////////////////////////////////////////////////////// -------------- API Requests -------------- ///////////////////////////////////////////////////////////////////////////////

// GET david's password from the database
const getPasswordD = async () => {
  const response = await fetch("http://localhost:3080/loginpageget", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  try {
    const result = await response.json();
    console.log(result);
    return result[0].passwordD;
  } catch (error) {
    console.log("err", error);
  }
};

// GET justin's password from the database
const getPasswordJ = async () => {
  const response = await fetch("http://localhost:3080/loginpageget", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  try {
    const result = await response.json();
    console.log(result);
    return result[0].passwordJ;
  } catch (error) {
    console.log("err", error);
  }
};

/////////////////////////////////////////////////////////
module.exports = {
  loadExpenses,
  saveExpenses,
  getExpenses,
  createExpense,
  updateExpenses,
  removeExpense,
  renderExpense,
  generateDOM,
  initializedEditPage,
  formatCurr,
  createSession,
  getSession,
  getCurrentTotal,
  renderCurrentSession,
  calculateDifference,
  reconcileBalanceD,
  reconcileBalanceJ,
  getPasswordD,
  getPasswordJ,
  saveExpensesDB,
  loadExpensesDB,
};
