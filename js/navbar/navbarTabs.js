var tabContainer = document.getElementsByClassName('page-tabs')[0]
var tabGroup = tabContainer.querySelector('#tabs') // TODO these names are confusing

/* tab events */

var lastTabDeletion = 0

/* draws tabs and manages tab events */

function getTabInput(tabId) {
    return document.querySelector('.tab-item[data-tab="{id}"] .tab-input'.replace('{id}', tabId))
}

function getTabElement(id) { // gets the DOM element for a tab
    return document.querySelector('.tab-item[data-tab="{id}"]'.replace('{id}', id))
}

function setActiveTabElement(tabId) {


    var activeTab = document.querySelector('.tab-item.active')

    if (activeTab) {
        activeTab.classList.remove('active')
    }

    var el = getTabElement(tabId)
    el.classList.add('active')


    requestIdleCallback(function () {
        requestAnimationFrame(function () {
            el.scrollIntoView({
                behavior: 'smooth'
            })
        })
    }, {
        timeout: 1500
    })

    // change size WW
    try {
        let allWW = document.querySelectorAll('#webviews webview')
        for (let i = 0; i < allWW.length; i++) {
            allWW[i].style.height = '99%'
        }
        setTimeout(function () {
            for (let i = 0; i < allWW.length; i++) {
                allWW[i].style.height = '100%'
            }
        }, 0)
    } catch (e) {
    }

    // click on empty tab - doubleclick
    if (el.querySelector('.title').innerText == '...') {
        setTimeout(function () {
            let elTIA = document.querySelector('.tab-item.active')
            if (elTIA) {
                elTIA.click()
            }
        }, 0)
    } else {
        modals.hide()
    }

}

function leaveTabEditMode(options) {

    var selTab = document.querySelector('.tab-item.selected')


    if (selTab) {
        selTab.classList.remove('selected')
        modals.hide()
    }
    if (options && options.blur) {
        var input = document.querySelector('.tab-item .tab-input:focus')
        if (input) {
            input.blur()
        }
    }


    document.body.classList.remove('is-edit-mode')
    hidesearchbar()


}

function enterEditMode(tabId) {
    // taskOverlay.hide()

    var tabEl = getTabElement(tabId)
    var webview = getWebview(tabId)

    var currentURL = tabs.get(tabId).url

    if (currentURL === 'about:blank') {
        currentURL = ''
    }

    var input = getTabInput(tabId)

    document.body.classList.add('is-edit-mode')
    tabEl.classList.add('selected')
    tabEl.classList.add('active')

    tabEl.addEventListener('blur', function (e) {
        openNavBarCollection(e)
    }, true);


    // modals.hide()
    modals.show('navBar')

    input.value = currentURL
    input.focus()
    input.select()

    showSearchbar(input)
    showSearchbarResults('', input, null)

    // show keyword suggestions in the searchbar

    if (webview.send) { // before first webview navigation, this will be undefined
        webview.send('getKeywordsData')
    }
}

// redraws all of the tabs in the tabstrip
function rerenderTabstrip() {
    say.c('rerenderTabstrip()', 'yellow')

    let selectedEl = document.querySelector('.selected')
    let selectedElId = ''
    let selectedElVal = ''
    if (selectedEl != null) {
        selectedElVal = selectedEl.querySelector('input').value
        selectedElId = selectedEl.getAttribute('data-tab')
    }

    empty(tabGroup)
    for (var i = 0; i < tabs.length; i++) {
        tabGroup.appendChild(createTabElement(tabs[i]))
        if (tabs[i].selected) {
            document.querySelectorAll('.tab-item')[i].classList.add('active')
        } else {
            document.querySelectorAll('.tab-item')[i].classList.remove('active')
        }
        if (selectedElId != '' && tabs[i].id == selectedElId) {
            document.querySelectorAll('.tab-item')[i].classList.add('selected')
            document.querySelectorAll('.tab-item')[i].querySelector('input').value = selectedElVal
            document.querySelectorAll('.tab-item')[i].querySelector('input').focus()
        } else {
            document.querySelectorAll('.tab-item')[i].classList.remove('selected')
        }
    }
    tabCount()
}

function tabCount() {
    tabGroup.className = tabGroup.className.replace(/tabs\d+/, '')
    tabGroup.classList.add('tabs' + tabs.length)
}

function tabLayout() {

}

function rerenderTabElement(tabId) {
    try {
        var tabEl = getTabElement(tabId)
        tabEl.querySelector('.addEmptyTabStyle').classList.remove('addEmptyTabStyle')
        var tabData = tabs.get(tabId)

        var tabTitle = tabData.title || ''

        var title = tabEl.querySelector('.tab-view-contents .title')

        title.textContent = tabTitle
        title.title = tabTitle

        var secIcon = tabEl.getElementsByClassName('icon-tab-not-secure')[0]

        // update the star to reflect whether the page is bookmarked or not
        bookmarks.renderStar(tabId)
    } catch (e) {

    }

}

function createTabElement(data) {

    var url = urlParser.parse(data.url)

    var tabEl = document.createElement('div')
    tabEl.className = 'tab-item'
    tabEl.setAttribute('data-tab', data.id)

    /* css :hover selectors are buggy when a webview is focused */
    tabEl.addEventListener('mouseenter', function (e) {
        this.classList.add('jshover')
    })

    tabEl.addEventListener('click', function (e) {
        sessionRestore.save()
        CT.render()
        setTimeout(function () {
            sessionRestore.save()
            CT.render()
        }, 100)
        tab._removeAllClassActive()
        tabEl.classList.add('selected')
        tabEl.classList.add('active')
        // load tab without secure
        setTimeout(function () {
            let el = tab._get(data.id)
            if (el.secure == undefined && el.url != '') {
                console.log(el)
                navigate(data.id, el.url)
            }
        }, 0)
    })

    tabEl.addEventListener('mouseleave', function (e) {
        this.classList.remove('jshover')
    })

    var ec = document.createElement('div')
    ec.className = 'tab-edit-contents'

    var input = document.createElement('input')
    input.className = 'tab-input mousetrap'
    input.setAttribute('placeholder', 'Search or enter address')
    input.value = url
    input.onblur = function () {
        console.log('==================================================================')
        console.log('onblur')
        console.log('==================================================================')
        // tab.focusOnInput == false
    }

    input.onfocus = function () {
        // tab.focusOnInput == true
        console.log('==================================================================')
        console.log('onfocus')
        console.log('==================================================================')

    }

    ec.appendChild(input)
    ec.appendChild(bookmarks.getStar(data.id))

    tabEl.appendChild(ec)

    var vc = document.createElement('div')
    vc.className = 'tab-view-contents'
    if (data.url == '' && data.title == '')
        vc.classList.add('addEmptyTabStyle')
    // vc.appendChild(readerView.getButton(data.id))

    // icons

    var iconArea = document.createElement('span')
    iconArea.className = 'tab-icon-area'

    var closeTabButton = document.createElement('i')
    closeTabButton.classList.add('tab-close-button')
    closeTabButton.classList.add('fa')
    closeTabButton.classList.add('fa-close')

    closeTabButton.addEventListener('click', function (e) {
        closeTab(data.id)
        sessionRestore.save()
        CT.render()

        // prevent the searchbar from being opened
        e.stopPropagation()
    })

    iconArea.appendChild(closeTabButton)

    if (data.private) {
        iconArea.insertAdjacentHTML('afterbegin', "<i class='fa fa-eye-slash icon-tab-is-private tab-info-icon'></i>")
        vc.setAttribute('title', 'Private tab')
    }

    vc.appendChild(iconArea)

    // favicon

    var favicon = document.createElement('img')
    favicon.className = 'favicon'
    vc.appendChild(favicon)

    // title

    var title = document.createElement('span')
    title.className = 'title'
    title.textContent = data.title || '...'

    vc.appendChild(title)

    tabEl.appendChild(vc)


    /* events */

    input.addEventListener('keydown', function (e) {
        if (e.keyCode === 9 || e.keyCode === 40) { // if the tab or arrow down key was pressed
            focussearchbarItem()
            e.preventDefault()
        } else if (e.keyCode == 27) {
            // if keydown ESC on input and tab title and url epmty - remove .active
            let elNodePP = e.target.parentNode.parentNode
            let idTab = elNodePP.getAttribute('data-tab')
            let elTab = tab._get(idTab)
            if (elTab.title == '' && elTab.url == '') {
                tab._clearSelected(idTab)
                // rerenderTabstrip()
                tab._removeAllClassActive()
            }
        }
    })

    // keypress doesn't fire on delete key - use keyup instead
    input.addEventListener('keyup', function (e) {
        if (e.keyCode === 8) {
            showSearchbarResults(this.value, this, e)
        }
    })

    input.addEventListener('keypress', function (e) {
        if (e.keyCode === 13) { // return key pressed; update the url
            openURLFromsearchbar(e, this.value)

            // focus the webview, so that autofocus inputs on the page work
            getWebview(tabs.getSelected()).focus()
        } else if (e.keyCode === 9) {
            return
            // tab key, do nothing - in keydown listener
        } else if (e.keyCode === 16) {
            return
            // shift key, do nothing
        } else if (e.keyCode === 8) {
            return
            // delete key is handled in keyUp
        }
        else { // show the searchbar
            showSearchbarResults(this.value, this, e)
        }

        // on keydown, if the autocomplete result doesn't change, we move the selection instead of regenerating it to avoid race conditions with typing. Adapted from https://github.com/patrickburke/jquery.inlineComplete

        var v = String.fromCharCode(e.keyCode).toLowerCase()
        var sel = this.value.substring(this.selectionStart, this.selectionEnd).indexOf(v)

        if (v && sel === 0) {
            this.selectionStart += 1
            e.preventDefault()
        }
    })

    // prevent clicking in the input from re-entering edit-tab mode

    input.addEventListener('click', function (e) {
        e.stopPropagation()
    })

    // click to enter edit mode or switch to a tab
    tabEl.addEventListener('click', function (e) {
        if (e.which === 2) { // if mouse middle click -> close tab
            closeTab(data.id)
        } else if (tabs.getSelected() !== data.id) { // else switch to tab if it isn't focused
            switchToTab(data.id)
        } else { // the tab is focused, edit tab instead
            enterEditMode(data.id)
        }
    })

    return tabEl

}

function addTab(tabId, options) {

    // debugger;

    /*
    options

      options.focus - whether to enter editing mode when the tab is created. Defaults to true.
      options.openInBackground - whether to open the tab without switching to it. Defaults to false.
      options.leaveEditMode - whether to hide the searchbar when creating the tab
    */

    options = options || {}

    if (options.leaveEditMode !== false) {
        leaveTabEditMode() // if a tab is in edit-mode, we want to exit it
    }

    tabId = tabId || tabs.add()


    var tab = tabs.get(tabId)

    // use the correct new tab colors
    //
    // if (tab.private && !tab.backgroundColor) {
    //     tabs.update(tabId, {
    //         backgroundColor: defaultColors.private[0],
    //         foregroundColor: defaultColors.private[1]
    //     })
    // } else if (!tab.backgroundColor) {
    //     tabs.update(tabId, {
    //         backgroundColor: defaultColors.regular[0],
    //         foregroundColor: defaultColors.regular[1]
    //     })
    // }

    findinpage.end()

    var index = tabs.getIndex(tabId)

    var tabEl = createTabElement(tab)

    let tempEl = ''
    for (let i = 0; i < tabState.tasks.length; i++) {
        for (let j = 0; j < tabState.tasks[i].tabs.length; j++) {
            if (tabState.tasks[i].tabs[j].id == tabId) {
                tempEl = tabState.tasks[i].tabs[j]
                tabs.destroy(tabId)
                tabState.tasks[i].tabs.unshift(tempEl)
                tabGroup.insertBefore(tabEl, tabGroup.firstChild)
                switchToTab(tabId)
            }
        }
    }

    addWebview(tabId)

    // open in background - we don't want to enter edit mode or switch to tab

    if (options.openInBackground) {
        return
    }

    switchToTab(tabId, {
        focusWebview: false
    })

    if (options.enterEditMode !== false) {
        // enterEditMode(tabId)
    }

    tabCount()

}

// startup state is created in sessionRestore.js

// when we click outside the navbar, we leave editing mode

bindWebviewEvent('focus', function () {
    leaveTabEditMode()
    findinpage.end()
})


function openNavBarCollection(e) {
    if (CT._openCollectionNOWClickTime + 5 < new Date() + 1) {
        try {
            if (e.relatedTarget && e.relatedTarget.classList.value == 'openTabsNOW') {
                modals.hide()
                navigate(e.target.parentNode.parentNode.getAttribute('data-tab'), e.relatedTarget.getAttribute("data-links"))
            }
        } catch (e) {
        }
        CT._openCollectionNOWClickTime = new Date() + 1
    }
}