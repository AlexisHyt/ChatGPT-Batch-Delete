let checkedItemsId = []
let accessToken = ''
let selectMultiple = false
const deleteButton = document.createElement("button");

// Running on load (with a little delay to let the page loads)
setTimeout(() => {
  // Extract access_token
  const inputString = document.scripts[2].textContent
  const regex = /"accessToken":"([^"]+)"/;
  const match = inputString.match(regex);
  if (match) {
    accessToken = match[1];
  } else {
    console.error("[ChatGPT Batch Delete] accessToken not found.");
    return;
  }

  const lastNavDiv = document.querySelector('nav > div:last-child');

  // Create delete button
  deleteButton.id = "ha--deleteButton";
  deleteButton.textContent = "Batch Delete";
  deleteButton.style.display = "none";
  deleteButton.addEventListener("click", () => {
    const uniqueCheckedItemsId = [...new Set(checkedItemsId)];

    uniqueCheckedItemsId.forEach(item => {
      const apiUrl = 'https://chatgpt.com/backend-api/conversation/' + item;
      const updateData = {
        is_visible: false
      };

      fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(updateData)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Remove LI element
            document.querySelector('a[href="/c/' + item + '"]').parentElement.parentElement.remove();
            checkedItemsId = checkedItemsId.filter(function(e) { return e !== item })
          }
        })
        .catch(err => console.log(err))
    })
    deleteButton.style.display = "none";
  });
  lastNavDiv.appendChild(deleteButton);

  // Handle when we press "Shift" to select multiple conversations
  window.addEventListener('keydown', (e) => {
    if (checkedItemsId.length > 0 && e.key === 'Shift') {
      selectMultiple = true
    }
  })
  window.addEventListener('keyup', (e) => {
    if (checkedItemsId.length > 0 && e.key === 'Shift') {
      selectMultiple = false
    }
  })
}, 3000)

// Interval to add the left checkbox on all conversations (<li>) links
setInterval(() => {
  const liItems = document.querySelectorAll("li[data-testid]");
  liItems.forEach(item => {
    // Prevent adding checkboxes when a checkbox is already present
    if (item.firstChild.nodeName === 'INPUT') {
      return;
    }

    // Adjust <li> style to accept a new checkbox element
    item.style.display = 'flex';
    item.style.alignItems = 'center';

    // Create new checkbox
    const newCheckbox = document.createElement("input");
    newCheckbox.type = "checkbox";
    newCheckbox.classList.add("ha--batch-checkbox");

    newCheckbox.addEventListener("change", (e) => {
      // Get the corresponding conversation id by extracting from href attribute
      const link = e.target.parentElement.querySelector('a');
      const conversationId = link.getAttribute("href").replaceAll('/c/', '');

      if (e.target.checked) {
        checkedItemsId.push(conversationId);

        if (selectMultiple) {
          const allCheckboxes = Array.from(document.querySelectorAll('input.ha--batch-checkbox'));
          const lastChecked = allCheckboxes.slice(0, allCheckboxes.indexOf(e.target)).reverse().find(checkbox => checkbox.checked);
          const checkboxesBefore = allCheckboxes.slice(allCheckboxes.indexOf(lastChecked), allCheckboxes.indexOf(e.target));
          checkboxesBefore.forEach((checkbox, i) => {
            checkbox.checked = true;

            const link = checkbox.parentElement.querySelector('a');
            const conversationId = link.getAttribute("href").replaceAll('/c/', '');
            checkedItemsId.push(conversationId);
          })
        }
      }
      else {
        checkedItemsId = checkedItemsId.filter(function(e) { return e !== conversationId })

        if (selectMultiple) {
          const allCheckboxes = Array.from(document.querySelectorAll('input.ha--batch-checkbox'));
          const lastNotChecked = allCheckboxes.slice(0, allCheckboxes.indexOf(e.target)).reverse().find(checkbox => !checkbox.checked);
          const checkboxesBefore = allCheckboxes.slice(allCheckboxes.indexOf(lastNotChecked), allCheckboxes.indexOf(e.target));
          checkboxesBefore.forEach((checkbox, i) => {
            checkbox.checked = false;

            const link = checkbox.parentElement.querySelector('a');
            const conversationId = link.getAttribute("href").replaceAll('/c/', '');
            checkedItemsId = checkedItemsId.filter(function(e) { return e !== conversationId })
          })
        }
      }

      // Update delete button state
      if (checkedItemsId.length > 0) {
        deleteButton.style.display = "block";
      }
      else if (checkedItemsId.length <= 0) {
        deleteButton.style.display = "none";
      }
    });

    item.prepend(newCheckbox);
  })
}, 3000)