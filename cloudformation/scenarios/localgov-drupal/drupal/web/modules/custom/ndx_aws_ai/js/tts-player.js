/**
 * @file
 * TTS Player functionality for Listen to Page feature.
 *
 * Story 4.6: Listen to Page (TTS Button)
 */

(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * TTS Player behavior.
   */
  Drupal.behaviors.ndxTtsPlayer = {
    attach: function (context) {
      once('tts-player', '.tts-player', context).forEach(function (player) {
        new TtsPlayer(player);
      });
    }
  };

  /**
   * TTS Player class.
   *
   * @param {HTMLElement} element
   *   The player container element.
   */
  function TtsPlayer(element) {
    this.element = element;
    this.audio = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.currentLanguage = drupalSettings.ndxTts.defaultLanguage || 'en-GB';
    this.playbackRate = 1.0;

    this.init();
  }

  /**
   * Initialize the player.
   */
  TtsPlayer.prototype.init = function () {
    this.cacheElements();
    this.bindEvents();
    this.updateButtonStates();
  };

  /**
   * Cache DOM element references.
   */
  TtsPlayer.prototype.cacheElements = function () {
    this.playButton = this.element.querySelector('.tts-play');
    this.pauseButton = this.element.querySelector('.tts-pause');
    this.stopButton = this.element.querySelector('.tts-stop');
    this.languageSelect = this.element.querySelector('.tts-language');
    this.progressBar = this.element.querySelector('.tts-progress');
    this.timeDisplay = this.element.querySelector('.tts-time');
    this.speedSlider = this.element.querySelector('.tts-speed');
    this.speedDisplay = this.element.querySelector('.tts-speed-display');
    this.statusRegion = this.element.querySelector('.tts-player__status');
  };

  /**
   * Bind event handlers.
   */
  TtsPlayer.prototype.bindEvents = function () {
    var self = this;

    // Play button.
    if (this.playButton) {
      this.playButton.addEventListener('click', function () {
        self.play();
      });
    }

    // Pause button.
    if (this.pauseButton) {
      this.pauseButton.addEventListener('click', function () {
        self.pause();
      });
    }

    // Stop button.
    if (this.stopButton) {
      this.stopButton.addEventListener('click', function () {
        self.stop();
      });
    }

    // Language selector.
    if (this.languageSelect) {
      this.languageSelect.addEventListener('change', function () {
        self.currentLanguage = this.value;
        // If playing, restart with new language.
        if (self.isPlaying) {
          self.stop();
          self.play();
        }
      });
    }

    // Progress bar seek.
    if (this.progressBar) {
      this.progressBar.addEventListener('input', function () {
        if (self.audio && self.audio.duration) {
          self.audio.currentTime = (this.value / 100) * self.audio.duration;
        }
      });
    }

    // Speed slider.
    if (this.speedSlider) {
      this.speedSlider.addEventListener('input', function () {
        self.playbackRate = parseFloat(this.value);
        if (self.audio) {
          self.audio.playbackRate = self.playbackRate;
        }
        if (self.speedDisplay) {
          self.speedDisplay.textContent = self.playbackRate + 'x';
        }
      });
    }

    // Keyboard shortcuts.
    document.addEventListener('keydown', function (e) {
      // Only handle if player is in viewport and not in an input.
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && self.isPlayerVisible()) {
        e.preventDefault();
        self.togglePlayPause();
      }

      if (e.code === 'Escape' && self.isPlaying) {
        self.stop();
      }
    });
  };

  /**
   * Check if player is visible in viewport.
   */
  TtsPlayer.prototype.isPlayerVisible = function () {
    var rect = this.element.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  /**
   * Toggle play/pause state.
   */
  TtsPlayer.prototype.togglePlayPause = function () {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };

  /**
   * Start playback.
   */
  TtsPlayer.prototype.play = function () {
    var self = this;

    // If we have an audio element paused, resume it.
    if (this.audio && this.audio.paused) {
      this.audio.play();
      this.isPlaying = true;
      this.updateButtonStates();
      this.announce(Drupal.t('Playing'));
      return;
    }

    // Otherwise, generate new audio.
    this.generateAudio().then(function (audioUrl) {
      self.audio = new Audio(audioUrl);
      self.audio.playbackRate = self.playbackRate;

      self.audio.addEventListener('timeupdate', function () {
        self.updateProgress();
      });

      self.audio.addEventListener('ended', function () {
        self.stop();
        self.announce(Drupal.t('Playback complete'));
      });

      self.audio.addEventListener('error', function () {
        self.handleError(Drupal.t('Audio playback error'));
      });

      self.audio.play();
      self.isPlaying = true;
      self.updateButtonStates();
      self.announce(Drupal.t('Playing'));
    }).catch(function (error) {
      self.handleError(error.message || Drupal.t('Failed to generate audio'));
    });
  };

  /**
   * Pause playback.
   */
  TtsPlayer.prototype.pause = function () {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.updateButtonStates();
    this.announce(Drupal.t('Paused'));
  };

  /**
   * Stop playback.
   */
  TtsPlayer.prototype.stop = function () {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
    this.updateProgress();
    this.updateButtonStates();
    this.announce(Drupal.t('Stopped'));
  };

  /**
   * Generate audio from page content.
   *
   * @returns {Promise<string>}
   *   Promise resolving to audio blob URL.
   */
  TtsPlayer.prototype.generateAudio = function () {
    var self = this;

    this.isLoading = true;
    this.updateButtonStates();
    this.announce(Drupal.t('Generating audio, please wait'));

    var content = this.extractPageContent();

    if (!content || content.trim().length === 0) {
      this.isLoading = false;
      this.updateButtonStates();
      return Promise.reject(new Error(Drupal.t('No content found on this page')));
    }

    return fetch(drupalSettings.ndxTts.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
        language: this.currentLanguage
      })
    }).then(function (response) {
      self.isLoading = false;
      self.updateButtonStates();

      if (!response.ok) {
        return response.json().then(function (data) {
          throw new Error(data.error || 'Request failed');
        });
      }
      return response.blob();
    }).then(function (blob) {
      return URL.createObjectURL(blob);
    });
  };

  /**
   * Extract readable content from the page.
   *
   * @returns {string}
   *   The extracted text content.
   */
  TtsPlayer.prototype.extractPageContent = function () {
    // Try various selectors for main content.
    var selectors = [
      'article.node .node__content',
      'article.node',
      '.node__content',
      'main article',
      'main .content',
      '#content article',
      'main'
    ];

    var content = null;
    for (var i = 0; i < selectors.length; i++) {
      var element = document.querySelector(selectors[i]);
      if (element) {
        content = element;
        break;
      }
    }

    if (!content) {
      return '';
    }

    // Clone to avoid modifying the DOM.
    var clone = content.cloneNode(true);

    // Remove elements we don't want to read.
    var removeSelectors = [
      'nav', 'aside', 'footer', 'header',
      '.sidebar', '.breadcrumb', '.pager', '.menu',
      '.tts-player', '.contextual', '.visually-hidden',
      'script', 'style', 'noscript', 'iframe', 'svg',
      '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
      'button', 'input', 'select', 'textarea'
    ];

    removeSelectors.forEach(function (sel) {
      clone.querySelectorAll(sel).forEach(function (el) {
        el.remove();
      });
    });

    // Get text content and clean it up.
    var text = clone.textContent || '';
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  };

  /**
   * Update progress display.
   */
  TtsPlayer.prototype.updateProgress = function () {
    if (!this.audio) {
      if (this.progressBar) {
        this.progressBar.value = 0;
      }
      if (this.timeDisplay) {
        this.timeDisplay.textContent = '0:00 / 0:00';
      }
      return;
    }

    var current = this.audio.currentTime;
    var duration = this.audio.duration || 0;
    var percent = duration > 0 ? (current / duration) * 100 : 0;

    if (this.progressBar) {
      this.progressBar.value = percent;
    }

    if (this.timeDisplay) {
      this.timeDisplay.textContent = this.formatTime(current) + ' / ' + this.formatTime(duration);
    }
  };

  /**
   * Format time in M:SS format.
   *
   * @param {number} seconds
   *   Time in seconds.
   * @returns {string}
   *   Formatted time string.
   */
  TtsPlayer.prototype.formatTime = function (seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  /**
   * Update button visibility based on state.
   */
  TtsPlayer.prototype.updateButtonStates = function () {
    if (this.playButton) {
      this.playButton.hidden = this.isPlaying;
      this.playButton.disabled = this.isLoading;
    }

    if (this.pauseButton) {
      this.pauseButton.hidden = !this.isPlaying;
    }

    if (this.stopButton) {
      this.stopButton.disabled = !this.isPlaying && !this.audio;
    }

    // Update loading state.
    this.element.classList.toggle('tts-player--loading', this.isLoading);
    this.element.classList.toggle('tts-player--playing', this.isPlaying);
  };

  /**
   * Announce message to screen readers.
   *
   * @param {string} message
   *   The message to announce.
   */
  TtsPlayer.prototype.announce = function (message) {
    if (this.statusRegion) {
      this.statusRegion.textContent = message;
    }
    Drupal.announce(message);
  };

  /**
   * Handle error.
   *
   * @param {string} message
   *   Error message.
   */
  TtsPlayer.prototype.handleError = function (message) {
    this.isLoading = false;
    this.isPlaying = false;
    this.updateButtonStates();
    this.announce(Drupal.t('Error: @message', { '@message': message }));

    console.error('TTS Player error:', message);
  };

})(Drupal, drupalSettings, once);
