/* eslint-disable jest/no-mocks-import */
/**
 * @jest-environment jsdom
 */
import { screen, waitFor, within } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockedStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = screen.getByTestId("icon-window");
      await waitFor(() => windowIcon);
      expect(windowIcon).toHaveClass("active-icon"); //TODO 5
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const datesSorted = [...dates].sort((a, b) => new Date(b.date) - new Date(a.date));
      expect(dates).toEqual(datesSorted)
    })

    // -------------------------------------------------------- //
    // -------------------------------------------------------- //
    // -------------------------------------------------------- //

    describe("When I click on one eye icon", () => {
      test("Then a modal should open", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });

        const iconEyes = screen.getAllByTestId("icon-eye");

        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);

        const modale = document.getElementById("modaleFile");

        ///////////////////////////////////////////////////////////////////////////////////////
        $.fn.modal = jest.fn(() => modale.classList.add("show")); // bootstrap Modal JQUERY //
        /////////////////////////////////////////////////////////////////////////////////////

        iconEyes.forEach((iconEye) => {
          iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
          userEvent.click(iconEye);

          expect(handleClickIconEye).toHaveBeenCalled();

          expect(modale).toHaveClass("show");
        });
      });
    });

    describe("When I went on Bills page and it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ loading: true });
        expect(screen.getByText("Loading...")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    describe("When I am on Bills page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
        document.body.innerHTML = BillsUI({ error: "error message" });
        expect(screen.getByText("Erreur")).toBeVisible();
        document.body.innerHTML = "";
      });
    });

    ///////////////////// GET ///////////////////////////
    describe("When I navigate to Bills Page", () => {
      test("get msg from mock API", async () => {
        jest.spyOn(mockedStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();

        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText("Mes notes de frais"));

        const billsTableRows = screen.getByTestId("tbody");

        expect(billsTableRows).toBeTruthy();
        expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);
      });

      test("API return 404 message error", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("API return 500 message error", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
