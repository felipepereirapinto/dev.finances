const Modal = {
  // toggle() {
  //   document
  //   .querySelector('.modal-overlay')
  //   .classList
  //   .toggle('active')
  // },

  open() {
    document
    .querySelector('.modal-overlay')
    .classList
    .add('active')
  },

  close() {
    Transaction.selectedIndex = null
    Form.clearFields()
    document.querySelector('.modal-overlay').classList.remove('active')
  },

  closeOutside() {
    // Fecha o modal se clicar fora do formulário
    const overlay = document.querySelector('.modal-overlay')
    overlay
      .addEventListener('click', e => e.target == overlay && Modal.close())
  },
}

Modal.closeOutside()

const Storage = {
  get() {
    return (
      JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    )
  },

  set(transactions) {
    localStorage.setItem("dev.finances:transactions",
    JSON.stringify(transactions))
  }
}

const Transaction = {
  all: Storage.get(),
  // filtered: Storage.get(),
  selectedIndex: null,

  add(transaction) {
    this.all.push(transaction)
    App.reload()
  },

  remove(index) {
    this.all.splice(index, 1)
    App.reload()
  },

  edit(index) {
    this.selectedIndex = index;
    Form.fill(this.all[index])
    Modal.open();
  },

  removeOldIfUpdating () {
    // Se estiver editando, apaga o velho
    (this.selectedIndex !== null) && this.remove(this.selectedIndex)
  },

  incomes() {
    let income = 0
    this.all.forEach(transaction => {
      (transaction.amount > 0) && (income += transaction.amount)
    })
    return income
  },

  expenses() {
    let expense = 0
    this.all.forEach(transaction => {
      (transaction.amount < 0) && (expense += transaction.amount)
    })
    return expense
  },

  total() {
    return this.incomes() + this.expenses()
  }
}

const DOM = {
  transactionsContainer: document.querySelector('#data-table tbody'),

  addTransaction(transaction, index) {
    const tr = document.createElement('tr')
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
    tr.dataset.index = index
    
    DOM.transactionsContainer.appendChild(tr)
  },

  innerHTMLTransaction(transaction, index) {
    const CSSclass = transaction.amount > 0 ? 'income' : 'expense'

    const amount = Utils.formatCurrency(transaction.amount)

    const html = `
    <tr>
      <td class="description">${transaction.description}</td>
      <td class="${CSSclass}">${amount}</td>
      <td class="date">${transaction.date}</td>
      <td class="edit">
        <img class="icon"
          onclick="Transaction.edit(${index})"
          src="./assets/icon-cog.svg"
          alt="Remover transação"
        >
      </td>
      <td class="remove">
        <img class="icon"
          onclick="Transaction.remove(${index})"
          src="./assets/icon-bin.svg"
          alt="Remover transação"
        >
      </td>
    </tr>
    `

    return html
  },

  updateBalance() {
    document
      .getElementById('incomeDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.incomes())
    document
      .getElementById('expenseDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.expenses())
    document
      .getElementById('totalDisplay')
      .innerHTML = Utils.formatCurrency(Transaction.total())
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = ''
  }
}

const Utils = {
  formatCurrency(value) {
    const signal = Number(value) < 0 ? '-' : ''

    value = String(value).replace(/\D/g, '')

    value = Number(value) / 100

    value = value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })

    return signal + value
  },

  sort(transactions) {
    return transactions.sort((a,b) => {
      let aDate = new Date(a.date.split('/').reverse())
      let bDate = new Date(b.date.split('/').reverse())
      return aDate - bDate
    })
  }
}

const Form = {

  description: document.querySelector('input#description'),
  amount: document.querySelector('input#amount'),
  date: document.querySelector('input#date'),

  getValues() {
    return {
      description: Form.description.value,
      amount: Form.amount.value,
      date: Form.date.value
    }
  },

  validateFields() {
    const { description, amount, date} = Form.getValues()
    
    if(description.trim()==='' || amount.trim() ===''|| date.trim()==='') {
      throw new Error('Por favor, preencha todos os campos')
    }
  },

  formatValues() {
    let { description, amount, date} = Form.getValues()

    amount = Number(amount) * 100
    date = date.split('-').reverse().join('/')

    return {
      description,
      amount,
      date
    }
  },

  clearFields() {
    Form.description.value = ''
    Form.amount.value = ''
    Form.date.value = ''
  },

  submit(event) {
    event.preventDefault()

    try {
      Form.validateFields()
      const transaction = Form.formatValues()

      // Se estiver editando, apaga o velho e cria um novo
      Transaction.removeOldIfUpdating()     

      Transaction.add(transaction)
      Form.clearFields()
      Modal.close()
    } catch (error) {
      alert(error.message)
    }
  },

  fill({ description, amount, date }) {
    Form.description.value = description
    Form.amount.value = amount/100
    Form.date.value = date.split('/').reverse().join('-')
  }
}

const App = {
  init() {
    Transaction.all = Utils.sort(Transaction.all)

    Transaction.all.forEach(DOM.addTransaction)
    
    DOM.updateBalance()

    Storage.set(Transaction.all)
  },

  reload() {
    DOM.clearTransactions()
    App.init()
  },
}

App.init()
