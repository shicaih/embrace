'use strict';

const bgImg = [
  'https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/report-bg-dark.png?v=1650581936303',
  'https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/report-bg-white.png?v=1650581892010'
]
const iconSrc = {
  'home': '/assets/Decor - W + Home.png',
  'ethnicity': '/assets/Decor - W + Ethnicity.png',
  'food': '/assets/Decor - W + Food.png',
  'music': '/assets/Decor - W + Music.png',
  'star': '/assets/Decor - Star + LB (1).png',
  'wheel': '/assets/0648p X 0648p.png'
}
class Report extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      data: {},
      loaded: false,
    };
  }

  componentWillMount() {
    this.socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);
    this.socket.emit("initReport", window.sessionStorage.getItem("uuid"));
    this.socket.on("playerReport", d => {
      //d.nImportantLocations = 3
      //d.importantLocationExamples = ['a','b']
      this.setState({data: d, loaded: true})
      console.log(d)
    
      const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'vertical',
        loop: false,
        slidesPerView: 1,
        mousewheel: true,
        // If we need pagination
        pagination: {
          el: '.swiper-pagination',
          //dynamicBullets: true,
          clickable: true,
          
        },
      
        // Navigation arrows
        navigation: {
          nextEl: '.next',
          prevEl: '.swiper-button-prev',
        },
      
        // And if we need scrollbar
        scrollbar: {
          el: '.swiper-scrollbar',
        },
        effect: 'slide',
        fadeEffect: {
          crossFade: true
        },
      });
    })  
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }
  render() {
  
  let sectionCount = 0
  
  
  return (
    <div style={{'wdith':'100%','height':'100%'}}>
      <div class="next">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 next-icon" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div class="swiper">
      <div class="swiper-pagination"></div>
    
      <div class="swiper-wrapper">

  
    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class="bg-icon-top" src={iconSrc.wheel}/>
        <img class="bg-icon-bottom" src={iconSrc.wheel}/>

        <div class="reportText">
          <h1 class='identity wide-bottom wide-top' style={{'color':'#372B24'}}>
            Hi <span id="nickname">{window.sessionStorage.getItem ('name')}</span>,  
          </h1>
          <h1 class="wide-top narrow-bottom">{this.state.data.nPlayer}</h1>
          <p>people joined Embrace today!</p>

        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <div class="reportText">
          <p>
            Throughout the activity, you scored 
          </p>
          <div style={{'display':'flex','justify-content':'space-between','align-items':'center','margin':'-1rem'}}>
            <img width="80" height="80" src={iconSrc.star} style={{'transform':'rotate(330deg)'}}/>
            <h1 class='wide-top wide-bottom'>{this.state.data.nPlayer}</h1> 
            <img width="80" height="80" src={iconSrc.star} style={{'transform':'rotate(30deg)'}}/> 
          </div>
          <p>
            star(s) by finding different identities on them. 
          </p>
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        
        <img class='bg-icon-top' src={iconSrc.home} />
        <img class='bg-icon-bottom' src={iconSrc.home} /> 
        <div class="reportText">
          <p>
            You folks are from different places around the world!
          </p>
          <h1 class='wide-top'>{this.state.data.nCountriesStates}</h1>
          <p class='caption' style={{'margin-bottom':'30px'}}>
            different countries & states!
          </p>
        </div>
      </div>
    </div>

    
    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-top' src={iconSrc.home} />
        <img class='bg-icon-bottom' src={iconSrc.home} /> 
        <div class="reportText">
          {
            (this.state.data.location == 'Prefer not to say' || this.state.data.location == '⊘')  
              && 
              (
                (
                  this.state.data.nPlayerSameLocation <= 1 
                  &&
                  <p>You were the only one who chose not to share your Home.</p>
                ) 
                ||
                (
                  <React.Fragment>
                    <h1>{this.state.data.nPlayerSameLocation}</h1>
                    <p>chose not to shair their Home, including you!</p>
                  </React.Fragment>
                )
              )
          }
          {
            (this.state.data.location != 'Prefer not to say' && this.state.data.location != '⊘')
              &&
              (
                (
                  this.state.data.nPlayerSameLocation <= 1 
                  &&
                  <React.Fragment>
                    <p>You are the only person from</p>
                    <h1 class='wide-top narrow-bottom'>{this.state.data.location}!</h1>
                  </React.Fragment>
                )
                ||
                (
                  <React.Fragment>
                    <h1>{this.state.data.nPlayerSameLocation - 1}</h1>
                    <p>{this.state.data.nPlayerSameLocation - 1 > 1 ?'people are' : 'person is'} also from</p>
                    <h1 class='wide-top identity'>{this.state.data.location}!</h1>
                  </React.Fragment>
                )
              )
          }
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-bottom' src={iconSrc.home} /> 
        <div class="reportText" style={{'text-align':'left'}}>
          <h1>{this.state.data.nPlayerLocationImportant}</h1>
          <p class='caption'>people also considered Home as an important identity!</p>
          <p class='caption' style={{'magin-bottom':'0.5rem'}}>They are from</p>
          {this.state.data.importantLocationExamples && this.state.data.importantLocationExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem'}}>{e}</p>)}
          {
            this.state.data.importantLocationExamples
            &&
            this.state.data.nImportantLocations > this.state.data.importantLocationExamples.length
            &&
              <p style={{'text-align':'right','margin-top':'0.125rem'}}>and {this.state.data.nImportantLocations - this.state.data.importantLocationExamples.length} more!</p>
          }
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-top' src={iconSrc.ethnicity} />
        <img class='bg-icon-bottom' src={iconSrc.ethnicity} /> 
        <div class="reportText">
          <p>
            You folks come from different ethnic backgrounds!
          </p>
          <h1 class='wide-top'>{this.state.data.nEthnicity}</h1>
          <p class='caption' style={{'margin-bottom':'30px'}}>
            different ethnicities!
          </p>
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-bottom' src={iconSrc.ethnicity} /> 
        <div class="reportText" style={{'text-align':'left'}}>
          <h1 >{this.state.data.nPlayerEthnicityImportant}</h1>
          <p class='caption'>people also considered Ethnicity as an important identity!</p>
          <p class='caption' style={{'magin-bottom':'0.5rem'}}>They are</p>
          {this.state.data.importantEthnicityExamples && this.state.data.importantEthnicityExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem'}}>{e}</p>)}
          {
            this.state.data.importantEthnicityExamples
            &&
            this.state.data.nImportantEthnicities > this.state.data.importantEthnicityExamples.length
            &&
              <p style={{'text-align':'right','margin-top':'0.125rem'}}>and {this.state.data.nImportantLocations - this.state.data.importantLocationExamples.length} more!</p>
          }
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-top' src={iconSrc.music} />
        {
          (this.state.data.nPlayerSameMusic <= 1 && 
          <img class='bg-icon-bottom' src={iconSrc.music} />)
           || 
           <img class='bg-icon-bottom' src={iconSrc.ethnicity} />
        }
        <div class="reportText">
          {
            (
              this.state.data.nPlayerSameMusic <= 1 
                &&
                (
                  (
                    (this.state.data.music == 'Prefer not to say' || this.state.data.music == '⊘')
                    &&
                    <p>You were the only one who chose not to share your favorite music!</p>
                  )
                    ||
                    <React.Fragment>
                      <p>You have unique taste in Music! You are the only one who chose</p>
                      <h1 class='wide-top identity'>{this.state.data.music}!</h1>
                    </React.Fragment>
                )
            )
              ||
            (
              (
                (this.state.data.music == 'Prefer not to say' || this.state.data.music == '⊘')
                  &&
                  <React.Fragment>
                    <h1>{this.state.data.nPlayerSameMusic}</h1>
                    <p>chose not to shair their favorite music, including you!</p>
                    {this.state.data.nSameMusicLocation >= 1  
                      && 
                      <React.Fragment>
                        <p class="caption" style={{'textAlign':'left'}}>They are from place(s) like</p>
                        {this.state.data.sameMusicLocationExamples && this.state.data.sameMusicLocationExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem','textAlign':'left'}}>{e}</p>)}
                      </React.Fragment> 
                    }
                  </React.Fragment>
              )
              ||
                <React.Fragment>
                  <h1>{this.state.data.nPlayerSameMusic}</h1>
                  <p>people enjoy <span class='themeColor'>{this.state.data.music}</span>, including you!</p>
                  {this.state.data.nSameMusicLocation >= 1  
                    && 
                    <React.Fragment>
                      <p class="caption" style={{'textAlign':'left'}}>They are from place(s) like</p>
                      {this.state.data.sameMusicLocationExamples && this.state.data.sameMusicLocationExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem','textAlign':'left'}}>{e}</p>)}
                    </React.Fragment> 
                  }
                </React.Fragment>
            )
          }
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <img class='bg-icon-top' src={iconSrc.food} />
        {
          (this.state.data.nPlayerSameFood <= 1 && 
          <img class='bg-icon-bottom' src={iconSrc.food} />)
           || 
           <img class='bg-icon-bottom' src={iconSrc.ethnicity} />
        }
        <div class="reportText">
          {
            (
              this.state.data.nPlayerSameFood <= 1 
                &&
                (
                  (
                    (this.state.data.food == 'Prefer not to say' || this.state.data.food == '⊘')
                    &&
                    <p>You were the only one who chose not to share your favorite food!</p>
                  )
                    ||
                    <React.Fragment>
                      <p>You have unique taste in Food! You are the only one who chose</p>
                      <h1 class='wide-top identity'>{this.state.data.food}!</h1>
                    </React.Fragment>
                )
            )
              ||
            (
              (
                (this.state.data.food == 'Prefer not to say' || this.state.data.food == '⊘')
                  &&
                  <React.Fragment>
                    <h1>{this.state.data.nPlayerSameFood}</h1>
                    <p>chose not to shair their favorite food, including you!</p>
                    {this.state.data.nSameFoodLocation >= 1  
                      && 
                      <React.Fragment>
                        <p class='caption' style={{'textAlign':'left'}}>They are from place(s) like</p>
                        {this.state.data.sameFoodLocationExamples && this.state.data.sameFoodLocationExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem','textAlign':'left'}}>{e}</p>)}
                      </React.Fragment> 
                    }
                  </React.Fragment>
              )
              ||
                <React.Fragment>
                  <h1>{this.state.data.nPlayerSameFood}</h1>
                  <p>people enjoy <span class='themeColor'>{this.state.data.food}</span>, including you!</p>
                  {this.state.data.nSameFoodLocation >= 1  
                    && 
                    <React.Fragment>
                      <p class="caption" style={{'textAlign':'left'}}>They are from place(s) like</p>
                      {this.state.data.sameFoodLocationExamples && this.state.data.sameFoodLocationExamples.map(e => <p class='themeColor' style={{'margin':'0.5rem','margin-left':'2rem','textAlign':'left'}}>{e}</p>)}
                    </React.Fragment> 
                  }
                </React.Fragment>
            )
          }
        </div>
      </div>
    </div>

    <div class="swiper-slide">
      <div class={`section bg${(sectionCount)%2 == 0 ? '1' : '2'} ${this.state.loaded ? '' : 'hide'}`}>
        <img class="bg-top" src={bgImg[(sectionCount++)%2]}/>
        <div class="reportText">
          <p>Thank you for participating in Embrace!</p>
          <img class="icon" src={iconSrc.wheel}/>
        </div>
      </div>
    </div>      
    
      </div>
    </div>
    </div>

  )
  }
}
console.log('123')
const e = React.createElement;
const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(e(Report));