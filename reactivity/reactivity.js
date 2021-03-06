const reactiveMap = new WeakMap()
const targetMap = new WeakMap()
const effectStack = []

function effect(fn) {
  try {
    effectStack.push(fn)
    return fn()
  } finally {
    effectStack.pop()
  }
}

function reactive(object) {
  if (reactiveMap.has(object)) return reactiveMap.get(object)

  const proxy = new Proxy(object, handlers)

  reactiveMap.set(object, proxy)
  return proxy
}

function track(target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 第二层依赖使用Set存放key对应的effect
  let dep = depsMap.get(key)
  if (!dep) {
    targetMap.get(target).set(key, (dep = new Set()))
  }

  // 取当前栈中的effect存入第二层依赖中
  const activeEffect = effectStack[effectStack.length - 1]
  activeEffect && dep.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (depsMap) {
    const effects = depsMap.get(key)
    effects && effects.forEach(run => run())
  }
}

function computed(fn) {
  return {
    get value() {
      return effect(fn)
    }
  }
}

/**
 * 处理器对象，定义捕获器
 */
const handlers = {
  set(target, key) {
    Reflect.set(...arguments)
    trigger(target, key)
    return true
  },
  get(target, key) {
    track(target, key)
    return typeof target[key] === 'object'
        ? reactive(target[key])
        : Reflect.get(...arguments)
  },
}

export {
  effect,
  reactive,
  computed,
}