const convertDateToTimeAgo = date => {
    let seconds = Math.floor((new Date() - new Date(date)) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    return Math.floor(seconds) + " seconds ago"
}
const scrollToTopOfList = _ => {
    const items = document.querySelectorAll(".notes > ul > li")
    if (items.length > 0) items[items.length - 1].scrollIntoView()
}
let editItem = null
const addItemToList = res => {
    const item = {
        "_id": res["_id"],
        "id": res["id"],
        "text": res["text"],
        "done": res["done"],
        "created_at": res["created_at"],
        "updated_at": res["updated_at"]
    }
    const date = item["created_at"] === item["updated_at"] ? `created ${convertDateToTimeAgo(item["created_at"])}` : `updated ${convertDateToTimeAgo(item["updated_at"])}`
    const li = document.createElement("li")
    li.id = `${item["_id"]}`
    li.innerHTML =
        `<div>
            <label onclick="event.stopPropagation()">
                <input type="checkbox" onclick="doneItem('${item["_id"]}', '${item["done"]}')" ${item["done"]? 'checked' : ''}>
            </label>
            <div title="Push to Edit">
                <p class="${item['done'] ? "line-through" : ""}">${item["text"]}</p>
                <small>${date}</small>
            </div>
        </div>
        <button type="button" class="delete" onclick="event.stopPropagation()">
            <svg onclick="deleteItem('${item["_id"]}')" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>`
    li.onclick = _ => {
        editItem = item
        document.getElementById("text").value = item["text"]
        document.getElementById("save").hidden = true
        document.getElementById("cancel").hidden = false
        document.getElementById("update").hidden = false
    }
    document.querySelector(".notes > ul").appendChild(li)
    scrollToTopOfList()
}
const showErrorMessage = errorMessage => {
    document.querySelector(".error").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5722" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><small>${errorMessage}</small>`
}
const methods = Object.freeze({
    GET: Symbol("GET"),
    POST: Symbol("POST"),
    PATCH: Symbol("PATCH"),
    DELETE: Symbol("DELETE"),
})
const sendRequest = async (endPoint, method = typeof methods, body = null) => {
    try {
        const response = await fetch("https://todoer-7876.restdb.io/rest/" + endPoint, {
            method: method.description,
            headers: {"content-type": "application/json", "x-apikey": "paste-your-restdb.io-api-key-in-here", "cache-control": "no-cache"},
            body: body ? JSON.stringify(body) : null
        })
        return await response.json()
    } catch (error) {
        showErrorMessage(error.message)
    }
}
window.onload = _ => {
    sendRequest("notes", methods.GET).then(res => {
        if (res && res.length > 0) {
            document.querySelector(".empty").style.display = "none"
            res.sort((a, b) => new Date(b["created_at"]) - new Date(a["created_at"])).forEach(item => addItemToList(item))
        } else document.querySelector(".empty").style.display = "block"
    })
}
const text = document.getElementById("text")
const saveButton = document.getElementById("save")
saveButton.addEventListener("click", _ => {
    saveButton.setAttribute("disabled", "disabled")
    if (text.value.trim().length > 0) {
        const date = new Date()
        sendRequest("notes", methods.POST, {"text": text.value.trim(), "done": false, "created_at": date, "updated_at": date}).then(res => {
            addItemToList(res)
            document.getElementById("text").value = ""
        }).finally(_ => {
            saveButton.removeAttribute("disabled")
        })
    } else showErrorMessage("Please fill out this field.")
})
const restForm = _ => {
    editItem = null
    document.getElementById("text").value = ""
    document.getElementById("cancel").hidden = true
    document.getElementById("update").hidden = true
    document.getElementById("save").hidden = false
}
const updateButton = document.getElementById("update")
updateButton.addEventListener("click", _ => {
    updateButton.setAttribute("disabled", "disabled")
    if (text.value.trim().length > 0) {
        console.log(editItem["_id"])
        sendRequest("notes/" + editItem["_id"], methods.PATCH, {"text": text.value.trim(), "updated_at": new Date()})
            .then(res => {
                document.querySelector(".notes > ul").removeChild(document.getElementById(res["id"]))
                addItemToList(res)
                restForm()
            })
            .finally(_ => {
                updateButton.removeAttribute("disabled")
            })
    } else showErrorMessage("Please fill out this field.")
})
const cancelButton = document.getElementById("cancel")
cancelButton.addEventListener("click", _ => restForm())
const doneItem = (_id, done) => {
    sendRequest("notes/" + _id, methods.PATCH, {"done": done !== 'true', "updated_at": new Date()})
        .then(res => {
            document.querySelector(".notes > ul").removeChild(document.getElementById(_id))
            addItemToList(res)
        })
}
const deleteItem = _id => {
    sendRequest("notes/" + _id, methods.DELETE).then(_ => {
        document.querySelector(".notes > ul").removeChild(document.getElementById(_id))
    })
}