import Express from 'express'
import SlideShow from '../showyslides/showy-api'
import path from 'path'
import fs from 'fs'

// Make an HTTP server
let app = new Express()

// Make a slideshow object
let ppt = new SlideShow('powerpoint')
let showInfo = {}
let showFiles = []

async function startup (filename) {
  // Make sure powerpoint is running
  try {
    await ppt.boot()
  } catch (err) {
    if (err !== 'application already running') {
      console.log('ERROR: startup failed.')
      console.log(err)
      return { error: err }
    }
  }

  if (filename) {
    // Close the current file (if any) before opening a new one
    try {
      await ppt.close()
    } catch (err) {
      if (err !== 'No presentation loaded') {
        console.log('ERROR: failed to close current presentation.')
        console.log(err)
        return { error: err }
      }
    }

    // Try to open the indicated filename
    try {
      console.log(`Opening ${filename}`)
      await ppt.open(path.join(__dirname, filename))
    } catch (err) {
      console.log('ERROR: failed to load slideshow')
      console.log(err)
      return { error: err }
    }
  }

  // Update show info, thumbnails and state
  try {
    showInfo = await getShowInfo()
    await getShowThumbnails()
    return await getShowState()
  } catch (err) {
    console.log('ERROR: could not retrieve basic info')
    console.log(err)
    return { error: err }
  }
}

async function startSlideshow () {
  try {
    await ppt.start()
    return await getShowState()
  } catch (err) {
    console.log('ERROR: ppt.start failed')
    console.log(err)
  }
}

async function stopSlideshow () {
  try {
    await ppt.stop()
    return await getShowState()
  } catch (err) {
    console.log('ERROR: ppt.start failed')
    console.log(err)
    return { error: err }
  }
}

async function nextSlide () {
  try {
    await ppt.next()
    return await getShowState()
  } catch (err) {
    console.log('ERROR: ppt.next failed')
    console.log(err)
    return { error: err }
  }
}

async function prevSlide () {
  try {
    await ppt.prev()
    return await getShowState()
  } catch (err) {
    console.log('ERROR: ppt.prev failed')
    console.log(err)
    return { error: err }
  }
}

async function gotoSlide (which) {
  try {
    await ppt.goto(which)
    return await getShowState()
  } catch (err) {
    console.log('ERROR: ppt.goto failed')
    console.log(err)
    return { error: err }
  }
}

async function getShowState () {
  if (!showInfo.titles || !showInfo.notes) {
    return { error: 'not ready' }
  }

  try {
    let state = await ppt.stat()
    state.buildSteps = state.steps
    if (state.position < 1 || state.position > showInfo.titles.length) {
      state.slideTitle = '??'
      state.slideNotes = '??'
    } else {
      state.slideTitle = showInfo.titles[state.position - 1]
      state.slideNote = showInfo.notes[state.position - 1]

      state.prevNote = showInfo.notes[state.position - 2]
      state.nextNote = showInfo.notes[state.position]

      if (state.position - 2 < 0) {
        state.prevNote = ''
      }

      if (state.position >= showInfo.titles.length) {
        state.nextNote = ''
      }
    }
    return state
  } catch (err) {
    console.log('ERROR: ppt.stat failed')
    console.log(err)
    return { error: err }
  }
}

async function getShowInfo () {
  try {
    return await ppt.info()
  } catch (err) {
    console.log('ERROR: ppt.info failed')
    console.log(err)
    return { error: err }
  }
}

async function getShowThumbnails () {
  try {
    let thumbPath = path.join(__dirname, '/public/images/')
    return await ppt.thumbs(thumbPath)
  } catch (err) {
    console.log('ERROR: ppt.thumbs failed')
    console.log(err)
    return { error: err }
  }
}

// Setup a responder for ALL requests
app.use((req, res, next) => {
  console.info(`${req.method} request at ${req.url}`)
  next()
})

app.get('/state', async (req, res) => {
  try {
    let showState = await getShowState()
    res.send({ ok: true, state: showState })
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/files', async (req, res) => {
  res.send({ ok: true, files: showFiles })
})

app.get('/info', async (req, res) => {
  try {
    let showInfo = await getShowInfo()
    res.send({ ok: true, info: showInfo })
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/thumbs', async (req, res) => {
  try {
    await getShowThumbnails()
    res.send({ ok: true })
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/startSlideshow', async (req, res) => {
  try {
    await startSlideshow()
    let showState = await gotoSlide(1)
    if (showState.error) {
      res.send({ ok: false, state: showState })
    } else {
      res.send({ ok: true, state: showState })
    }
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/stopSlideshow', async (req, res) => {
  try {
    let showState = await stopSlideshow()
    if (showState.error) {
      res.send({ ok: false, state: showState })
    } else {
      res.send({ ok: true, state: showState })
    }
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/nextSlide', async (req, res) => {
  try {
    let showState = await nextSlide()
    if (showState.error) {
      res.send({ ok: false, state: showState })
    } else {
      res.send({ ok: true, state: showState })
    }
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/previousSlide', async (req, res) => {
  try {
    let showState = await prevSlide()
    if (showState.error) {
      res.send({ ok: false, state: showState })
    } else {
      res.send({ ok: true, state: showState })
    }
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

app.get('/jumpToSlide/:slideIndex', async (req, res) => {
  try {
    let showState = await gotoSlide(parseInt(req.params.slideIndex))
    if (showState.error) {
      res.send({ ok: false, state: showState })
    } else {
      res.send({ ok: true, state: showState })
    }
  } catch (err) {
    res.send({ ok: false, error: err })
  }
})

// Look for static content to satisfy the request
app.use(Express.static('./public'))

// Get list of all powerpoint slides
let filelist = fs.readdirSync(path.join(__dirname, '/public/slideshows'))
showFiles = filelist.filter((file) => {
  return (file.match(/(\.pptm|\.pptx|\.ppt|\.key|\.odp|\.otp)$/) != null)
})

// Startup powerpoint
let fileToOpen = ''
if (showFiles.length > 0) {
  fileToOpen = path.join(__dirname, '/public/slideshows/', showFiles[0])
}
startup() // fileToOpen)

// Start the server
let server = app.listen(8675)
console.info(`Server running at port 8675`)
