'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var bgImg = ['https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/report-bg-dark.png?v=1650581936303', '/assets/report-decoration-light.png'];
var iconSrc = {
  'home': '/assets/Decor - W + Home.png',
  'ethnicity': '/assets/Decor - W + Ethnicity.png',
  'food': '/assets/Decor - W + Food.png',
  'music': '/assets/Decor - W + Music.png',
  'star': '/assets/Decor - Star + LB (1).png',
  'wheel': '/assets/0648p X 0648p.png'
};

var Report = function (_React$Component) {
  _inherits(Report, _React$Component);

  function Report(props) {
    _classCallCheck(this, Report);

    var _this = _possibleConstructorReturn(this, (Report.__proto__ || Object.getPrototypeOf(Report)).call(this, props));

    _this.state = {
      data: {},
      loaded: false
    };
    return _this;
  }

  _createClass(Report, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      this.socket = io.connect(config.server.url.replace(/\/+$/, '') + ':' + config.server.port);
      this.socket.emit("initReport", window.sessionStorage.getItem("uuid"));
      this.socket.on("playerReport", function (d) {
        //d.nImportantLocations = 3
        //d.importantLocationExamples = ['a','b']
        _this2.setState({ data: d, loaded: true });
        console.log(d);

        var swiper = new Swiper('.swiper', {
          // Optional parameters
          direction: 'vertical',
          loop: false,
          slidesPerView: 1,
          mousewheel: true,
          // If we need pagination
          pagination: {
            el: '.swiper-pagination',
            //dynamicBullets: true,
            clickable: true

          },

          // Navigation arrows
          navigation: {
            nextEl: '.next',
            prevEl: '.swiper-button-prev'
          },

          // And if we need scrollbar
          scrollbar: {
            el: '.swiper-scrollbar'
          },
          effect: 'slide',
          fadeEffect: {
            crossFade: true
          }
        });
      });
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.socket.disconnect();
    }
  }, {
    key: 'render',
    value: function render() {

      var sectionCount = 0;

      return React.createElement(
        'div',
        { style: { 'wdith': '100%', 'height': '100%' } },
        React.createElement(
          'div',
          { 'class': 'next' },
          React.createElement(
            'svg',
            { xmlns: 'http://www.w3.org/2000/svg', 'class': 'h-6 w-6 next-icon', fill: 'none', viewBox: '0 0 24 24',
              stroke: 'currentColor', 'stroke-width': '2' },
            React.createElement('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19 9l-7 7-7-7' })
          )
        ),
        React.createElement(
          'div',
          { 'class': 'swiper' },
          React.createElement('div', { 'class': 'swiper-pagination' }),
          React.createElement(
            'div',
            { 'class': 'swiper-wrapper' },
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.wheel }),
                React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.wheel }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  React.createElement(
                    'h1',
                    { 'class': 'identity wide-bottom wide-top', style: { 'color': '#372B24' } },
                    'Hi ',
                    React.createElement(
                      'span',
                      { id: 'nickname' },
                      window.sessionStorage.getItem('name')
                    ),
                    ','
                  ),
                  React.createElement(
                    'h1',
                    { 'class': 'wide-top narrow-bottom' },
                    this.state.data.nPlayer
                  ),
                  React.createElement(
                    'p',
                    null,
                    'people joined Embrace today!'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  React.createElement(
                    'p',
                    null,
                    'Throughout the activity, you scored'
                  ),
                  React.createElement(
                    'div',
                    { style: { 'display': 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin': '-1rem' } },
                    React.createElement('img', { width: '80', height: '80', src: iconSrc.star, style: { 'transform': 'rotate(330deg)' } }),
                    React.createElement(
                      'h1',
                      { 'class': 'wide-top wide-bottom' },
                      this.state.data.nStar
                    ),
                    React.createElement('img', { width: '80', height: '80', src: iconSrc.star, style: { 'transform': 'rotate(30deg)' } })
                  ),
                  React.createElement(
                    'p',
                    null,
                    'star(s) by finding different identities on them.'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.home }),
                React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.home }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  React.createElement(
                    'p',
                    null,
                    'You folks are from different places around the world!'
                  ),
                  React.createElement(
                    'h1',
                    { 'class': 'wide-top' },
                    this.state.data.nCountriesStates
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption', style: { 'margin-bottom': '30px' } },
                    'different countries & states!'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.home }),
                React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.home }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  (this.state.data.location == 'Prefer not to say' || this.state.data.location == '⊘') && (this.state.data.nPlayerSameLocation <= 1 && React.createElement(
                    'p',
                    null,
                    'You were the only one who chose not to share your Home.'
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameLocation
                    ),
                    React.createElement(
                      'p',
                      null,
                      'chose not to shair their Home, including you!'
                    )
                  )),
                  this.state.data.location != 'Prefer not to say' && this.state.data.location != '⊘' && (this.state.data.nPlayerSameLocation <= 1 && React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'p',
                      null,
                      'You are the only person from'
                    ),
                    React.createElement(
                      'h1',
                      { 'class': 'wide-top narrow-bottom' },
                      this.state.data.location,
                      '!'
                    )
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameLocation - 1
                    ),
                    React.createElement(
                      'p',
                      null,
                      this.state.data.nPlayerSameLocation - 1 > 1 ? 'people are' : 'person is',
                      ' also from'
                    ),
                    React.createElement(
                      'h1',
                      { 'class': 'wide-top identity' },
                      this.state.data.location,
                      '!'
                    )
                  ))
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement(
                  'div',
                  { 'class': 'reportText', style: { 'text-align': 'left' } },
                  React.createElement(
                    'h1',
                    null,
                    this.state.data.nPlayerLocationImportant
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption' },
                    'people also considered Home as an important identity!'
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption', style: { 'magin-bottom': '0.5rem' } },
                    'They are from'
                  ),
                  this.state.data.importantLocationExamples && this.state.data.importantLocationExamples.map(function (e) {
                    return React.createElement(
                      'p',
                      { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem' } },
                      e
                    );
                  }),
                  this.state.data.importantLocationExamples && this.state.data.nImportantLocations > this.state.data.importantLocationExamples.length && React.createElement(
                    'p',
                    { style: { 'text-align': 'right', 'margin-top': '0.125rem' } },
                    'and ',
                    this.state.data.nImportantLocations - this.state.data.importantLocationExamples.length,
                    ' more!'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.ethnicity }),
                React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.ethnicity }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  React.createElement(
                    'p',
                    null,
                    'You folks come from different ethnic backgrounds!'
                  ),
                  React.createElement(
                    'h1',
                    { 'class': 'wide-top' },
                    this.state.data.nEthnicity
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption', style: { 'margin-bottom': '30px' } },
                    'different ethnicities!'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement(
                  'div',
                  { 'class': 'reportText', style: { 'text-align': 'left' } },
                  React.createElement(
                    'h1',
                    null,
                    this.state.data.nPlayerEthnicityImportant
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption' },
                    'people also considered Ethnicity as an important identity!'
                  ),
                  React.createElement(
                    'p',
                    { 'class': 'caption', style: { 'magin-bottom': '0.5rem' } },
                    'They are'
                  ),
                  this.state.data.importantEthnicityExamples && this.state.data.importantEthnicityExamples.map(function (e) {
                    return React.createElement(
                      'p',
                      { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem' } },
                      e
                    );
                  }),
                  this.state.data.importantEthnicityExamples && this.state.data.nImportantEthnicities > this.state.data.importantEthnicityExamples.length && React.createElement(
                    'p',
                    { style: { 'text-align': 'right', 'margin-top': '0.125rem' } },
                    'and ',
                    this.state.data.nImportantLocations - this.state.data.importantLocationExamples.length,
                    ' more!'
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.music }),
                this.state.data.nPlayerSameMusic <= 1 && React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.music }) || React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.ethnicity }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  this.state.data.nPlayerSameMusic <= 1 && ((this.state.data.music == 'Prefer not to say' || this.state.data.music == '⊘') && React.createElement(
                    'p',
                    null,
                    'You were the only one who chose not to share your favorite music!'
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'p',
                      null,
                      'You have unique taste in Music! You are the only one who chose'
                    ),
                    React.createElement(
                      'h1',
                      { 'class': 'wide-top identity' },
                      this.state.data.music,
                      '!'
                    )
                  )) || (this.state.data.music == 'Prefer not to say' || this.state.data.music == '⊘') && React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameMusic
                    ),
                    React.createElement(
                      'p',
                      null,
                      'chose not to shair their favorite music, including you!'
                    ),
                    this.state.data.nSameMusicLocation >= 1 && React.createElement(
                      React.Fragment,
                      null,
                      React.createElement(
                        'p',
                        { 'class': 'caption', style: { 'textAlign': 'left' } },
                        'They are from place(s) like'
                      ),
                      this.state.data.sameMusicLocationExamples && this.state.data.sameMusicLocationExamples.map(function (e) {
                        return React.createElement(
                          'p',
                          { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem', 'textAlign': 'left' } },
                          e
                        );
                      })
                    )
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameMusic
                    ),
                    React.createElement(
                      'p',
                      null,
                      'people enjoy ',
                      React.createElement(
                        'span',
                        { 'class': 'themeColor' },
                        this.state.data.music
                      ),
                      ', including you!'
                    ),
                    this.state.data.nSameMusicLocation >= 1 && React.createElement(
                      React.Fragment,
                      null,
                      React.createElement(
                        'p',
                        { 'class': 'caption', style: { 'textAlign': 'left' } },
                        'They are from place(s) like'
                      ),
                      this.state.data.sameMusicLocationExamples && this.state.data.sameMusicLocationExamples.map(function (e) {
                        return React.createElement(
                          'p',
                          { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem', 'textAlign': 'left' } },
                          e
                        );
                      })
                    )
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement('img', { 'class': 'bg-icon-top', src: iconSrc.food }),
                this.state.data.nPlayerSameFood <= 1 && React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.food }) || React.createElement('img', { 'class': 'bg-icon-bottom', src: iconSrc.ethnicity }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  this.state.data.nPlayerSameFood <= 1 && ((this.state.data.food == 'Prefer not to say' || this.state.data.food == '⊘') && React.createElement(
                    'p',
                    null,
                    'You were the only one who chose not to share your favorite food!'
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'p',
                      null,
                      'You have unique taste in Food! You are the only one who chose'
                    ),
                    React.createElement(
                      'h1',
                      { 'class': 'wide-top identity' },
                      this.state.data.food,
                      '!'
                    )
                  )) || (this.state.data.food == 'Prefer not to say' || this.state.data.food == '⊘') && React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameFood
                    ),
                    React.createElement(
                      'p',
                      null,
                      'chose not to shair their favorite food, including you!'
                    ),
                    this.state.data.nSameFoodLocation >= 1 && React.createElement(
                      React.Fragment,
                      null,
                      React.createElement(
                        'p',
                        { 'class': 'caption', style: { 'textAlign': 'left' } },
                        'They are from place(s) like'
                      ),
                      this.state.data.sameFoodLocationExamples && this.state.data.sameFoodLocationExamples.map(function (e) {
                        return React.createElement(
                          'p',
                          { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem', 'textAlign': 'left' } },
                          e
                        );
                      })
                    )
                  ) || React.createElement(
                    React.Fragment,
                    null,
                    React.createElement(
                      'h1',
                      null,
                      this.state.data.nPlayerSameFood
                    ),
                    React.createElement(
                      'p',
                      null,
                      'people enjoy ',
                      React.createElement(
                        'span',
                        { 'class': 'themeColor' },
                        this.state.data.food
                      ),
                      ', including you!'
                    ),
                    this.state.data.nSameFoodLocation >= 1 && React.createElement(
                      React.Fragment,
                      null,
                      React.createElement(
                        'p',
                        { 'class': 'caption', style: { 'textAlign': 'left' } },
                        'They are from place(s) like'
                      ),
                      this.state.data.sameFoodLocationExamples && this.state.data.sameFoodLocationExamples.map(function (e) {
                        return React.createElement(
                          'p',
                          { 'class': 'themeColor', style: { 'margin': '0.5rem', 'margin-left': '2rem', 'textAlign': 'left' } },
                          e
                        );
                      })
                    )
                  )
                )
              )
            ),
            React.createElement(
              'div',
              { 'class': 'swiper-slide' },
              React.createElement(
                'div',
                { 'class': 'section bg' + (sectionCount % 2 == 0 ? '1' : '2') + ' ' + (this.state.loaded ? '' : 'hide') },
                React.createElement('img', { 'class': 'bg-top', src: bgImg[sectionCount++ % 2] }),
                React.createElement(
                  'div',
                  { 'class': 'reportText' },
                  React.createElement(
                    'p',
                    null,
                    'Thank you for participating in Embrace!'
                  ),
                  React.createElement('img', { 'class': 'icon', src: iconSrc.wheel })
                )
              )
            )
          )
        )
      );
    }
  }]);

  return Report;
}(React.Component);

console.log('123');
var e = React.createElement;
var domContainer = document.querySelector('#root');
var root = ReactDOM.createRoot(domContainer);
root.render(e(Report));