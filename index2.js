const step1NoButton = document.getElementById('step1-no-button');
const step1YesButton = document.getElementById('step1-yes-button');

const step2NoButton = document.getElementById('step2-no-button');
const step2YesButton = document.getElementById('step2-yes-button');

const consoleContainer = document.getElementById('console-container');
const startBnt = document.getElementById('start-bnt');
const audio = document.getElementById('audio');
const audio2 = document.getElementById('audio2');
const audio3 = document.getElementById('audio3');
const overlay = document.getElementById('overlay')
const imgContainer = document.getElementById('img-container');
const main = () => {
  var settings = {
    particles: {
      length: 100, // maximum amount of particles
      duration: 4, // particle duration in sec
      velocity: 80, // particle velocity in pixels/sec
      effect: -1.3, // play with this for a nice effect
      size: 8, // particle size in pixels
    },
  };
  var Particle = (function () {
    function Particle() {
      this.position = new Point();
      this.velocity = new Point();
      this.acceleration = new Point();
      this.age = 0;
    }
    Particle.prototype.initialize = function (x, y, dx, dy) {
      this.position.x = x;
      this.position.y = y;
      this.velocity.x = dx;
      this.velocity.y = dy;
      this.acceleration.x = dx * settings.particles.effect;
      this.acceleration.y = dy * settings.particles.effect;
      this.age = 0;
    };
    Particle.prototype.update = function (deltaTime) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.velocity.x += this.acceleration.x * deltaTime;
      this.velocity.y += this.acceleration.y * deltaTime;
      this.age += deltaTime;
    };
    Particle.prototype.draw = function (context, image) {
      function ease(t) {
        return --t * t * t + 1;
      }
      var size = image.width * ease(this.age / settings.particles.duration);
      context.globalAlpha = 1 - this.age / settings.particles.duration;
      context.drawImage(
        image,
        this.position.x - size / 2,
        this.position.y - size / 2,
        size,
        size,
      );
    };
    return Particle;
  })();
  var ParticlePool = (function () {
    var particles,
      firstActive = 0,
      firstFree = 0,
      duration = settings.particles.duration;

    function ParticlePool(length) {
      // create and populate particle pool
      particles = new Array(length);
      for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
    }
    ParticlePool.prototype.add = function (x, y, dx, dy) {
      particles[firstFree].initialize(x, y, dx, dy);

      // handle circular queue
      firstFree++;
      if (firstFree == particles.length) firstFree = 0;
      if (firstActive == firstFree) firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    };
    ParticlePool.prototype.update = function (deltaTime) {
      var i;

      // update active particles
      if (firstActive < firstFree) {
        for (i = firstActive; i < firstFree; i++)
          particles[i].update(deltaTime);
      }
      if (firstFree < firstActive) {
        for (i = firstActive; i < particles.length; i++)
          particles[i].update(deltaTime);
        for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
      }

      // remove inactive particles
      while (
        particles[firstActive].age >= duration &&
        firstActive != firstFree
      ) {
        firstActive++;
        if (firstActive == particles.length) firstActive = 0;
      }
    };
    ParticlePool.prototype.draw = function (context, image) {
      // draw active particles
      if (firstActive < firstFree) {
        for (i = firstActive; i < firstFree; i++)
          particles[i].draw(context, image);
      }
      if (firstFree < firstActive) {
        for (i = firstActive; i < particles.length; i++)
          particles[i].draw(context, image);
        for (i = 0; i < firstFree; i++) particles[i].draw(context, image);
      }
    };
    return ParticlePool;
  })();

  const Point = (function () {
    function Point(x, y) {
      this.x = typeof x !== 'undefined' ? x : 0;
      this.y = typeof y !== 'undefined' ? y : 0;
    }
    Point.prototype.clone = function () {
      return new Point(this.x, this.y);
    };
    Point.prototype.length = function (length) {
      if (typeof length == 'undefined')
        return Math.sqrt(this.x * this.x + this.y * this.y);
      this.normalize();
      this.x *= length;
      this.y *= length;
      return this;
    };
    Point.prototype.normalize = function () {
      var length = this.length();
      this.x /= length;
      this.y /= length;
      return this;
    };
    return Point;
  })();

  function pointOnHeart(t) {
    return new Point(
      160 * Math.pow(Math.sin(t), 3),
      130 * Math.cos(t) -
        50 * Math.cos(2 * t) -
        20 * Math.cos(3 * t) -
        10 * Math.cos(4 * t) +
        25,
    );
  }

  const getHeartImage = function () {
    const canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = settings.particles.size;
    canvas.height = settings.particles.size;
    // helper function to create the path
    function to(t) {
      let point = pointOnHeart(t);
      point.x =
        settings.particles.size / 2 + (point.x * settings.particles.size) / 350;
      point.y =
        settings.particles.size / 2 - (point.y * settings.particles.size) / 350;
      return point;
    }
    // create the path
    context.beginPath();
    let t = -Math.PI;
    let point = to(t);
    context.moveTo(point.x, point.y);
    while (t < Math.PI) {
      t += 0.01; // baby steps!
      point = to(t);
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    // create the fill
    context.fillStyle = '#f50b02';
    context.fill();
    // create the image
    const image = new Image();
    image.src = canvas.toDataURL();
    return image;
  };

  class Heart {
    x = 350;
    y = 750;
    velocity = 80;
    acceleration;
  }

  class Pools {
    sizes = 10;
    items = [];

    constructor(sizes) {
      this.sizes = sizes;
    }

    add(item) {
      if (this.items.length < 10) {
        this.items.push(item);
      }
    }

    update() {
      for (let i = 0; i < this.items.length; i++) {
        this.items[i].update();
      }
    }

    draw(context, image) {
      for (let i = 0; i < this.items.length; i++) {
        this.items[i].draw(context, image);
      }
    }
  }

  class TextItemLeft {
    direction = 'leftRight';
    globalAlpha = 1;
    object;
    constructor(x, y, object) {
      console.log('object', object);
      this.x = x;
      this.y = y;
      this.object = object;
    }

    update() {
      if (this.direction === 'leftRight') {
        this.x = this.x + 1.5;
        this.y = this.y - 1.5;
      } else {
        this.x = this.x - 1.5;
        this.y = this.y + 1.5;
      }

      if (this.x > 480 && this.y < 220) {
        this.direction = 'rightLeft';
        this.globalAlpha = 0.5;
      } else if (this.x < 220 && this.y > 480) {
        this.globalAlpha = 1;
        this.direction = 'leftRight';
      }
    }
    draw(context) {
      context.globalAlpha = this.globalAlpha;
      if (typeof this.object === 'string') {
        context.fillStyle = 'red';
        context.font = '600 14px Arial';
        context.fillText(this.object, this.x, this.y);
      } else {
        context.drawImage(this.object, this.x, this.y, 12, 12);
      }
    }
  }

  class TextItemRight {
    direction = 'leftRight';
    globalAlpha = 1;
    object;
    constructor(x, y, object) {
      console.log('object', object);
      this.x = x;
      this.y = y;
      this.object = object;
    }

    update() {
      if (this.direction === 'leftRight') {
        this.x = this.x - 1.5;
        this.y = this.y - 1.5;
      } else {
        this.x = this.x + 1.5;
        this.y = this.y + 1.5;
      }

      if (this.x < 220 && this.y < 220) {
        this.direction = 'rightLeft';
        this.globalAlpha = 0.5;
      } else if (this.x > 480 && this.y > 480) {
        this.globalAlpha = 1;
        this.direction = 'leftRight';
      }
    }
    draw(context) {
      context.globalAlpha = this.globalAlpha;
      if (typeof this.object === 'string') {
        context.fillStyle = 'red';
        context.font = '600 14px Arial';
        context.fillText(this.object, this.x, this.y);
      } else {
        context.drawImage(this.object, this.x, this.y, 5, 5);
      }
    }
  }

  (function (canvas) {
    const context = canvas.getContext('2d');
    let particles = new ParticlePool(settings.particles.length);
    let particleRate = settings.particles.length / settings.particles.duration; // particles/sec
    let time;

    const PoolRight = new Pools(10);
    const PoolLeft = new Pools(10);
    const image = getHeartImage();

    let x = 480;
    let y = 480;

    let x2 = 220;
    let y2 = 480;
    const textsRight = ['T', 'H', 'A', 'O'];
    const textsLeft = ['U', image, 'I'];
    textsRight.map((item, index) => {
      setTimeout(() => {
        PoolRight.add(new TextItemRight(x, y, item));
      }, [400 + 400 * index]);
    });

    textsLeft.map((item, index) => {
      setTimeout(() => {
        PoolLeft.add(new TextItemLeft(x2, y2, item));
      }, [400 + 400 * index]);
    });

    function render() {
      requestAnimationFrame(render);

      let newTime = new Date().getTime() / 1000;
      let deltaTime = newTime - (time || newTime);
      time = newTime;
      context.clearRect(0, 0, canvas.width, canvas.height);

      PoolRight.update();
      PoolRight.draw(context, image);

      PoolLeft.update();
      PoolLeft.draw(context, image);
      // create new particles
      var amount = 1;
      for (var i = 0; i < amount; i++) {
        var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        var dir = pos.clone().length(settings.particles.velocity);
        particles.add(
          canvas.width / 2 + pos.x,
          canvas.height / 2 - pos.y,
          dir.x,
          -dir.y,
        );
      }

      // update and draw particles
      particles.update(deltaTime);
      particles.draw(context, image);
    }

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
  })(document.getElementById('pinkboard'));
};

const handleConsole = (text, color, handler, audio) => {
  consoleText([...text], 'text', [
    // 'tomato',
    // 'rebeccapurple',
    // 'lightblue',
    color,
  ]);
  function consoleText(words, id, colors) {
    if (colors === undefined) colors = ['#fff'];
    var letterCount = 1;
    var x = 1;
    var waiting = false;
    var target = document.getElementById(id);
    target.setAttribute('style', 'color:' + colors[0]);
    let countLength = 0;
    const handle = function () {
      if (letterCount === 0 && waiting === false) {
        waiting = true;
        target.innerHTML = words[countLength].substring(0, letterCount);
        window.setTimeout(function () {
          var usedColor = colors.shift();
          colors.push(usedColor);
          var usedWord = words.shift();
          words.push(usedWord);
          x = 1;
          target.setAttribute('style', 'color:' + colors[0]);
          letterCount += x;
          waiting = false;
        }, 1000);
      } else if (
        letterCount === words[countLength].length + 1 &&
        waiting === false
      ) {
        if (countLength < words.length - 1) {
          letterCount = 1;
          window.setTimeout(handle, 120);
          countLength++;
        } else {
          if (handler) {
            handler();
            audio.pause();
          }
        }
      } else if (waiting === false) {
        target.innerHTML = words[countLength].substring(0, letterCount);
        letterCount += x;
        audio.play();
        window.setTimeout(handle, 120);
      }
    };

    window.setTimeout(handle, 120);
  }
};

const step1 = () => {
  handleConsole(
    [
      'Xin chào Thảo dễ thương, đáng yêu, xinh gái...',
      'Xứng đáng có người yêu là Nam dev',
      'Để tiếp tục xin trả lời cầu hỏi sau ạ',
      'Nay Thảo còn giận Nam Dev code giỏi, đẹp trai ko ạ',
    ],
    'rebeccapurple',
    () => {
      step1NoButton.classList.toggle('display-none');
      step1YesButton.classList.toggle('display-none');
    },
    audio,
  );
};

const step2 = () => {
  handleConsole(
    [
      'Anh biết mà, Thảo thương anh còn ko hết sao lại giận anh',
      'Please wait 5 seconds to continue',
    ],
    'tomato',
    () => {
      const arr = ['5', '4', '3', '2', '1'];
      for (let i = 0; i < arr.length; i++) {
        if (i === arr.length - 1) {
          setTimeout(() => {
            handleConsole(
              [arr[i]],
              'lightblue',
              () => {
                consoleContainer.classList.toggle('display-none');
                imgContainer.classList.toggle('display-none');
                overlay.classList.toggle('display-none');
                main();
                audio3.play();
              },
              audio2,
            );
          }, [1000 * (i + 1)]);
        } else {
          setTimeout(() => {
            handleConsole([arr[i]], 'lightblue', null, audio2);
          }, [1000 * (i + 1)]);
        }
      }
    },
    audio,
  );
};

const nextStep2 = () => {
  step1NoButton.classList.toggle('display-none');
  step1YesButton.classList.toggle('display-none');
  step2();
};

step1NoButton.addEventListener('mouseover', () => {
  let xRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  let yRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );

  step1NoButton.style.transform = `translate(${xRandom}px, ${yRandom}px)`;
});
step1NoButton.addEventListener('click', () => {
  let xRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  let yRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  step1NoButton.style.transform = `translate(${xRandom}px, ${yRandom}px)`;
});
step2NoButton.addEventListener('mouseover', () => {
  console.log('zoday');
  let xRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  let yRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );

  step2NoButton.style.transform = `translate(${xRandom}px, ${yRandom}px)`;
});
step2NoButton.addEventListener('click', () => {
  let xRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  let yRandom = Number(
    (Math.round(Math.random()) === 1 ? '-' : '') + (Math.random() * 200 + 100),
  );
  step2NoButton.style.transform = `translate(${xRandom}px, ${yRandom}px)`;
});

// step1();

// main();

const start = () => {
  step1();
  consoleContainer.classList.toggle('display-none');
  startBnt.classList.toggle('display-none');
};
