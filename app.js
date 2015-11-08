import _ from 'lodash'
import express from 'express'
import compression from 'compression'
import {fetchRadarImageUrls} from './fmi-radar-frames'
import {fetchPostProcessedRadarFrameAsGif} from './fmi-radar-images'

const PORT = process.env.PORT || 3000
const PUBLIC_FRAMES_ROOT = process.env.CLOUDFRONT_URL || `http://localhost:${PORT}/frame/`

const app = express()
app.use(compression())
app.use(express.static('public'))

app.get('/frames.json', (req, res) => {
  function toPublicUrl(radarUrl) {
    return {
      image: PUBLIC_FRAMES_ROOT + radarUrl.timestamp,
      timestamp: radarUrl.timestamp
    }
  }

  fetchRadarImageUrls().then((urls) => {
    res.json(urls.map(toPublicUrl))
  })
})

app.get('/wms/frames.json', (req, res) => res.redirect('/frames.json'))

app.get('/frame/:timestamp', (req, res) => {
  fetchRadarImageUrls().then((urls) => {
    const fmiRadarImage = _.find(urls, {timestamp: req.params.timestamp})
    if (fmiRadarImage) {
      fetchPostProcessedRadarFrameAsGif(fmiRadarImage.url).then(function (gif) {
        res.set('Content-Type', 'image/gif')
        res.send(gif)
      })
    } else {
      res.status(404).send('Sorry, no radar image found for that timestamp')
    }
  })
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`)
})
