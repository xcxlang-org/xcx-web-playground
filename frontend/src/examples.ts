export interface ExampleFile {
  name: string;
  content: string;
  description: string;
}

export const examples: ExampleFile[] = [
  {
    name: 'hello.xcx',
    description: 'Hello World',
    content: `--- Hello in XCX world

>! "Hello in XCX world";`
  },
  {
    name: 'fibonacci.xcx',
    description: 'Fibonacci sequence',
    content: `--- Fibonacci

func fib(i: n -> i) {
    if (n <= 1) then;
        return n;
    else;
        return fib(n - 1) + fib(n - 2);
    end;
};

for i in 0 to 10 do;
    >! fib(i);
end;`
  },
  {
    name: 'sieve.xcx',
    description: 'Sieve of Eratosthenes',
    content: `--- Sieve of Eratosthenes

const i: LIMIT = 50;
array:b: sieve;

for i in 0 to LIMIT do;
    sieve.push(true);
end;

for i in 2 to LIMIT do;
    if (sieve.get(i)) then;
        i: j = i * 2;
        while (j <= LIMIT) do;
            sieve.update(j, false);
            j = j + i;
        end;
    end;
end;

>! "Prime numbers up to " + s(LIMIT) + ":";
for i in 2 to LIMIT do;
    if (sieve.get(i)) then;
        >! i;
    end;
end;`
  },
  {
    name: 'factorial.xcx',
    description: 'Factorial calculation',
    content: `--- Factorial

func factorial(i: n -> i) {
    if (n <= 1) then;
        return 1;
    end;
    return n * factorial(n - 1);
};

i: num = 10;
i: result = factorial(num);
>! s(num) + "! = " + s(result);`
  },
  {
    name: 'counter.xcx',
    description: 'Simple counter',
    content: `--- Counter

i: count = 0;

for i in 1 to 10 do;
    count = count + 1;
    >! "Count: " + s(count);
end;

>! "Final count: " + s(count);`
  },
  {
    name: 'guess.xcx',
    description: 'Number guessing game',
    content: `--- Number Guessing Game

const i: SECRET = 42;
i: guess = 0;

>! "Guess the number (1-100)!";

while (guess != SECRET) do;
    >! "Enter your guess:";
    >? guess;

    if (guess < SECRET) then;
        >! "Too low!";
    elseif (guess > SECRET) then;
        >! "Too high!";
    end;
end;

>! "Correct! The number was " + s(SECRET);`
  }
];
