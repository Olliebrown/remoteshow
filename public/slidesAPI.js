// All of the info for the entire slideshow
let slidesInfo = {}

// Flag to disable or enable the keyboard listener
let keyInputEnabled = true

// Most recently seen slide number
let lastSlideNumber = -1
let curBuild = 1

function updateStatus (status) {
  // Check if slide advanced
  if (status.position !== lastSlideNumber) {
    curBuild = 1
  } else {
    curBuild = Math.min(status.buildSteps, curBuild + 1)
  }

  // Update various text statuses on page
  $('#PPTStatus').text(status.state)
  $('#curSlide').text(status.position)
  $('#totalSlides').text(status.slides)
  $('#curBuild').text(curBuild)
  $('#buildSteps').text(status.buildSteps)

  $('#prevNote').text(status.prevNote.split(/~/)[0])
  $('#curNote').text(status.slideNote.split(/~/)[0])
  $('#nextNote').text(status.nextNote.split(/~/)[0])

  // Wait one second before restoring input (avoids accidental double-clicks!)
  setTimeout(enableInput, 1000)

  // Update slide number
  lastSlideNumber = status.position
}

function disableInput (message) {
  // Default for the wait message
  message = message || 'Please wait ...'

  // Disable keyboard listener
  keyInputEnabled = false

  // Show the modal wait message in a way that cannot be dismissed manually
  $('#waitMessage').text(message)
  $('#waitModal').modal({ backdrop: 'static', keyboard: false })
  $('#waitModal').data('bs.modal').options.backdrop = 'static'
}

function enableInput () {
  // Restore the keyboard listener
  keyInputEnabled = true

  // Hide the modal wait message
  $('#waitModal').modal('hide')
}

function updateInfo (info) {
  slidesInfo = info
}

function pollCurrentState () {
  // Update current state
  $.get('state', {}, (data) => {
    updateStatus(data.state)
  }, 'json')

  // Update slideshow info
  $.get('info', {}, (data) => {
    updateInfo(data.info)
  }, 'json')
}

$(document).ready(() => {
  // Check if keyboard input listener is disabled
  if (!keyInputEnabled) { return }

  // Setup key listeners to advance or move back
  $(document).keydown((e) => {
    switch (e.which) {
      case 32: case 39: // Spacebar or Right Arrow => next slide/step
        $('#nextSlideBtn').trigger('click')
        break

      case 37: // Left Arrow => previous slide/step
        $('#prevSlideBtn').trigger('click')
        break
    }
  })

  // Fullscreen button
  $('#FSBtn').click((event) => {
    event.preventDefault()
    let elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen()
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen()
    } else { /* iOS Safari & iOS Chrome */
      window.alert('Fullscreen not supported')
    }
  })

  // Setup the start and stop buttons
  $('#startShowBtn').click((event) => {
    event.preventDefault()
    disableInput('Starting Slideshow ...')
    $.get('startSlideshow', {}, (data) => {
      updateStatus(data.state)
    }, 'json')
  })

  $('#stopShowBtn').click((event) => {
    event.preventDefault()
    disableInput('Stopping Slideshow ...')
    $.get('stopSlideshow', {}, (data) => {
      updateStatus(data.state)
    }, 'json')
  })

  // Setup the manual data sync button
  $('#syncBtn').click((event) => {
    event.preventDefault()
    pollCurrentState()
  })

  // Setup slide movement buttons
  $('#prevSlideBtn').click((event) => {
    event.preventDefault()
    disableInput('Backing up ...')
    $.get('previousSlide', {}, (data) => {
      updateStatus(data.state)
    }, 'json')
  })

  $('#nextSlideBtn').click((event) => {
    event.preventDefault()
    disableInput('Advancing ...')
    $.get('nextSlide', {}, (data) => {
      updateStatus(data.state)
    }, 'json')
  })

  // Initialize the state
  pollCurrentState()
})
