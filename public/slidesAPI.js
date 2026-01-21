// All of the info for the entire slideshow
let slidesInfo = {}

// Flag to disable or enable the keyboard listener
let keyInputEnabled = true

// Most recently seen slide number
let lastSlideNumber = -1
let curBuild = 1

function getTitle (title, notes) {
  // If there's a title, use it
  if (typeof title === 'string' && title !== '') {
    return title
  }

  // Fall back to the first line of the notes
  if (typeof notes === 'string' && notes !== '') {
    return notes.split(/\r?\n/)[0]
  }

  // Nothing to use
  return 'n/a'
}

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

  $('#prevNote').text(getTitle(status.prevTitle, status.prevNote))
  $('#curNote').text(getTitle(status.slideTitle, status.slideNote))
  $('#nextNote').text(getTitle(status.nextTitle, status.nextNote))

  // Wait one second before restoring input (avoids accidental double-clicks!)
  setTimeout(enableInput, 1000)

  // Update slide number
  lastSlideNumber = status.position

  // Update the thumbnail scroller
  buildThumbnailScroller(status.slides)

  // Scroll to proper slide thumbnail
  location.href = '#'
  location.href = `#slide-${status.position}`
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
  console.log('Re-enabling input')
  // Restore the keyboard listener
  keyInputEnabled = true

  // Hide the modal wait message
  $('#waitModal').modal('hide')
}

function updateInfo (info) {
  if (info) {
    slidesInfo = info
  }
}

function gotoSlide (event) {
  event.preventDefault()
  console.error('GOTO not enabled')
  // disableInput('Changing Slides ...')
  // const url = $(event.currentTarget).attr('href')
  // $.get(url, {}, (data) => {
  //   updateStatus(data.state)
  // }, 'json')
}

function pollCurrentState () {
  // Update slideshow info
  $.get('info', {}, (data) => {
    updateInfo(data.info)
  }, 'json')

  // Update current state
  $.get('state', {}, (data) => {
    updateStatus(data.state)
  }, 'json')
}

function buildThumbnail (slideNum) {
  const thumbLink = $('<a />').addClass('thumbnail')
  thumbLink.attr('href', `jumpToSlide/${slideNum}`)
  thumbLink.attr('id', `slide-${slideNum}`)
  const imgElem = $('<img />').attr('src', `images/thumbs/Slide${slideNum}.jpeg`)
  const labelElem = $('<span />').addClass('label label-primary').text(slideNum)

  thumbLink.append(imgElem)
  thumbLink.append(labelElem)
  thumbLink.css('vertical-align', 'top')
  thumbLink.click(gotoSlide)

  if (Array.isArray(slidesInfo.notes) && slideNum <= slidesInfo.notes.length) {
    const notesHTML = slidesInfo?.notes[slideNum - 1].replaceAll(/\r?\n/g, '<br/>')
    const notesElem = $('<p />').html(notesHTML)
    thumbLink.append(notesElem)
  }

  return thumbLink
}

function buildThumbnailScroller (slideCount) {
  $('#thumbnailScroll').empty()
  for (let i = 0; i < slideCount; i++) {
    const newThumb = buildThumbnail(i + 1)
    $('#thumbnailScroll').append(newThumb)
  }
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
    const elem = document.documentElement
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
