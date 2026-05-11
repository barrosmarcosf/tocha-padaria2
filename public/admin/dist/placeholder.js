/* global React, Ic, NAV */

function Placeholder({
  pageId
}) {
  const item = window.NAV.find(n => n.id === pageId);
  const label = item ? item.label : pageId;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, "Admin"), /*#__PURE__*/React.createElement("h1", null, label), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "P\xE1gina em constru\xE7\xE3o \u2014 estrutura existente preservada."))), /*#__PURE__*/React.createElement("div", {
    className: "grid",
    style: {
      gridTemplateColumns: 'repeat(3,1fr)'
    }
  }, [1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    className: "card hoverable",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.chart, null), "Bloco ", i), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "placeholder")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 120,
      borderRadius: 'var(--r)',
      background: 'repeating-linear-gradient(45deg, var(--panel-2), var(--panel-2) 8px, var(--panel-3) 8px, var(--panel-3) 16px)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--mono)',
      fontSize: 10,
      color: 'var(--ink-4)',
      letterSpacing: '0.16em',
      textTransform: 'uppercase'
    }
  }, "conte\xFAdo de ", label)))), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable mt",
    style: {
      marginTop: 'var(--gap)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.list, null), "Tabela"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "demonstrativo")), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Item"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Valor"))), /*#__PURE__*/React.createElement("tbody", null, [1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, "Registro ", i), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "tag gold"
  }, "Ativo")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, "R$ ", (i * 42).toFixed(2))))))));
}
window.Placeholder = Placeholder;