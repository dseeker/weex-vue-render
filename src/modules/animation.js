/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
const utils = {}
let endEvent
let styleName

const DESIGN_ROOT_VALUE = 75
const DISABLE_LAZY = true

const EVENT_NAME_MAP = {
  transition: 'transitionend',
  WebkitTransition: 'webkitTransitionEnd',
  MozTransition: 'mozTransitionEnd',
  OTransition: 'oTransitionEnd',
  msTransition: 'MSTransitionEnd'
}

function detectEvents () {
  const testEl = document.createElement('div')
  const style = testEl.style
  for (const name in EVENT_NAME_MAP) {
    if (name in style) {
      endEvent = EVENT_NAME_MAP[name]
      styleName = name
      break
    }
  }
}

detectEvents()

function transitionOnce (vnode, config, callback) {
  const {
    nextFrame,
    toCSSText,
    styleObject2rem,
    // normalizeStyle,
    isArray
  } = utils

  if (isArray(vnode)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[vue-render] the ref passed to animation.transitionOnce is a array.')
    }
    vnode = vnode[0]
  }

  const duration = config.duration || 0 // ms
  const timing = config.timingFunction || 'linear'
  const delay = config.delay || 0  // ms

  // TODO: parse transition properties
  const transitionValue = `all ${duration}ms ${timing} ${delay}ms`

  const dom = vnode instanceof HTMLElement ? vnode : vnode.$el
  // trigger image lazyloading by force.
  !DISABLE_LAZY && dom && weex.utils.fireLazyload(dom, true)

  const transitionEndHandler = function (event) {
    event && event.stopPropagation()
    if (endEvent) {
      dom.removeEventListener(endEvent, transitionEndHandler)
      dom.style[styleName] = ''
    }
    callback()
  }
  if (endEvent) {
    dom.style[styleName] = transitionValue
    dom.addEventListener(endEvent, transitionEndHandler)
  }
  nextFrame(() => {
    dom.style.cssText
      += toCSSText(styleObject2rem(config.styles, DESIGN_ROOT_VALUE) || {})
  })
}

const animation = {
  /**
   * transition
   * @param  {String} vnode
   * @param  {Object} config
   * @param  {String} callback
   */
  transition (vnode, config, callback) {
    if (!config.styles) { return }
    return transitionOnce(vnode, config, () => {
      callback && callback()
    })
  }
}

export default {
  init (weex) {
    const extendKeys = weex.utils.extendKeys
    extendKeys(utils, weex.utils, [
      'nextFrame',
      'toCSSText',
      'styleObject2rem',
      // 'autoPrefix',
      // 'normalizeStyle',
      'isArray'
    ])

    weex.registerModule('animation', animation)
  }
}
