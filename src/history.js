// Functions from the static functions folder
const myfuncs = require("./functions");
const formatCurr = myfuncs.formatCurr;
const calculateDifference = myfuncs.calculateDifference;
const reconcileBalanceD = myfuncs.reconcileBalanceD;
const reconcileBalanceJ = myfuncs.reconcileBalanceJ;
// const renderExpenseDB = myfuncs.renderExpenseDB;
const getCurrentTotalDB = myfuncs.getCurrentTotalDB;
const apifuncs = require("./api-functions");
const renderCurrentSessionDB = apifuncs.renderCurrentSessionDB;
const loadExpensesDB = apifuncs.loadExpensesDB;
const getSortedExpensesDB = apifuncs.getSortedExpensesDB;
const updateSessionDB = apifuncs.updateSessionDB;

const { url: base_url } = require("../env");
const getData = new Promise((res, rej) => {
  const parser = new URL(window.location);
  const pageQueryParam = parser.searchParams.get("page");

  fetch(`${base_url}/history/${pageQueryParam ? pageQueryParam : 1}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (response.status < 400) {
      res(response.json());
    }
  });
});

(function () {
  "use strict";

  function Pagination(dataSession, totalCount) {
    const prevButton = document.getElementById("button_prev");
    const nextButton = document.getElementById("button_next");
    const parser = new URL(window.location);
    const _current_page = parser.searchParams.get("page");
    let current_page = _current_page ? _current_page : 1;

    this.init = function () {
      renderPage(dataSession);
      pageNumbers();
      selectedPage();
      clickPage();
      addEventListeners();
    };

    let addEventListeners = function () {
      prevButton.addEventListener("click", prevPage);
      nextButton.addEventListener("click", nextPage);
    };

    // selectPage gives opacity to current page number. opacity: 1 means no blur/dim
    // if opacity is less than one then it's blurred/dimmed
    let selectedPage = function () {
      let page_number = document
        .getElementById("page_number")
        .getElementsByClassName("clickPageNumber");
      for (let i = 0; i < page_number.length; i++) {
        if (i == current_page - 1) {
          page_number[i].style.opacity = "1.0";
        } else {
          page_number[i].style.opacity = "0.5";
        }
      }
    };

    // checkButtonOpacity sets the opacity for prev and next buttons
    let checkButtonOpacity = function () {
      current_page == 1
        ? prevButton.classList.add("opacity")
        : prevButton.classList.remove("opacity");
      current_page == numPages()
        ? nextButton.classList.add("opacity")
        : nextButton.classList.remove("opacity");
    };

    let renderPage = function (d) {
      // doing stuff for difference and totals
      const totalD = document.querySelector("#totalD");
      const totalJ = document.querySelector("#totalJ");
      const differenceD = document.querySelector("#differenceD");
      const differenceJ = document.querySelector("#differenceJ");
      const dateShow1 = document.querySelector(".history-date1");
      const dateShow2 = document.querySelector(".history-date2");
      const info = document.querySelector(".info");
      const goBack = document.querySelector("#go_back");
      goBack.addEventListener("click", () => {
        location.assign(`render.html`);
      });
      // select tag for expenses for both people
      let expensesElDavid;
      let expensesElJustin;
      expensesElDavid = document.querySelector("#expenses");
      expensesElDavid.style.pointerEvents = "none";
      expensesElJustin = document.querySelector("#expensesJ");
      expensesElJustin.style.pointerEvents = "none";
      const { davidSess: davidExpenses, justinSess: justinExpenses } =
        d.expenses;
      let dTotal = 0;
      let jTotal = 0;
      let jDiff = 0;
      let dDiff = 0;
      if (davidExpenses.length > 0) {
        davidExpenses.forEach((davidExpenses) => {
          dTotal = dTotal + Number(davidExpenses.amount);
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
          jTotal = jTotal + Number(justinExpenses.amount);
          const expenseElJustin = generateDOM(justinExpenses);
          expensesElJustin.appendChild(expenseElJustin);
        });
      } else {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No expenses to show";
        emptyMessage.classList.add("empty-message");
        expensesElJustin.appendChild(emptyMessage);
      }
      // renderTotInd --- both Justin and David
      totalD.textContent = `${formatCurr(dTotal)}`;
      totalJ.textContent = `${formatCurr(jTotal)}`;
      // renderTotDiff --- both Justin and David
      const difference = calculateDifference(dTotal, jTotal);
      const dOperationSign = dTotal < jTotal ? "-" : "";
      const jOperationSign = jTotal < dTotal ? "-" : "";
      differenceD.textContent = `${dOperationSign} ${formatCurr(difference)}`;
      differenceJ.textContent = `${jOperationSign} ${formatCurr(difference)}`;
      dateShow1.textContent = `Start Date ${new Date(
        d.createdAt
      ).toLocaleString()}`;
      dateShow2.textContent = `Finish Date ${new Date(
        d.updatedAt
      ).toLocaleString()}`;
      info.textContent = `Session lasted for ${Math.floor(
        (new Date(d.updatedAt) - new Date(d.createdAt)) / (1000 * 60 * 60 * 24)
      )} days and reconciliation took place ${Math.floor(
        (new Date().getTime() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24)
      )} days ago`;
      // checkButtonOpacity();
    };
    // handles prev button click - refresh page if clicked
    let prevPage = function () {
      if (current_page > 1) {
        new URL(window.location);
        ``;
        parser.searchParams.set("page", Number(current_page) - 1);
        window.location = parser.href;
      }
    };
    // handles next button click - refresh page if clicked
    let nextPage = function () {
      if (current_page < numPages()) {
        new URL(window.location);
        parser.searchParams.set("page", Number(current_page) + 1);
        window.location = parser.href;
      }
    };
    // handles page numbre button click - refresh page if clicked
    let clickPage = function () {
      document.addEventListener("click", function (e) {
        if (
          e.target.nodeName == "SPAN" &&
          e.target.classList.contains("clickPageNumber")
        ) {
          let page_togo = e.target.textContent;
          parser.searchParams.set("page", page_togo);
          window.location = parser.href;
        }
      });
    };

    // renders page number blocks
    let pageNumbers = function () {
      let pageNumber = document.getElementById("page_number");
      pageNumber.innerHTML = "";

      for (let i = 1; i < numPages() + 1; i++) {
        pageNumber.innerHTML +=
          "<span class='clickPageNumber'>" + i + "</span>";
      }
    };

    // return int for how many pages exist
    let numPages = function () {
      return totalCount; // Math.ceil(objJson.length / records_per_page);
    };
  }

  function setVisible(selector, visible) {
    document.querySelector(selector).style.display = visible ? "block" : "none";
  }

  function loadingFunc() {
    setVisible(".main-container-history", true);
    setVisible("#loading", false);
  }
  getData.then((data) => {
    loadingFunc();
    let pagination = new Pagination(data.sessions[0], data.totalCount);
    pagination.init();
  });
})();

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
  expenseEl.setAttribute("href", `edit.html#${expense._id}`);
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
