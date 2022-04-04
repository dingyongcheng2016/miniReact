/** 步骤一 实现: createElement */ 
function createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: children.map(child =>
          typeof child === "object"
            ? child
            : createTextElement(child)
        ),
      },
    }
}


function createTextElement(text) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue: text,
        children: [],
      },
    }
}

// 创建dom节点
function createDom(fiber) {
    const dom =
      fiber.type == "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type)
  ​
    updateDom(dom, {}, fiber.props)
  ​
    return dom
  }
  ​

/** 步骤二 实现: render */ 
/**
 * @description 
 * 1、15版本架构中 递归生成vnode tree，不可中断无法突破cpu、io瓶颈、页面卡顿
 * 2、16版本之后fiber架构、fiber数据结构、fiber节点、requestIdleCallback,实现可中断更新
 */
function render(element, container){
    wipRoot = {
        dom: container,
        props: {
          children: [element],
        },
        alternate: currentRoot,
    }
    // 需要一个数组去保存要移除的 dom 节点
    deletions = [] 
    nextUnitOfWork = wipRoot
}

const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

// 更新fiber节点
function updateDom(dom, prevProps, nextProps) {

    //Remove old or changed event listeners
    Object.keys(prevProps)
    .filter(isEvent)
    .filter(
        key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
        const eventType = name
        .toLowerCase()
        .substring(2)
        dom.removeEventListener(
        eventType,
        prevProps[name]
        )
    })

    // Remove old properties
    Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
        dom[name] = ""
    })

    // Set new or changed properties
    Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
        dom[name] = nextProps[name]
    })

     // Add event listeners
    Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
        const eventType = name
        .toLowerCase()
        .substring(2)
        dom.addEventListener(
        eventType,
        nextProps[name]
        )
    })
​
}

// TODO add nodes to dom
function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child) 
    currentRoot = wipRoot
    wipRoot = null
}

// 执行递归提交
function commitWork(fiber) {
    if (!fiber) {
      return
    }
  
    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if (
        fiber.effectTag === "PLACEMENT" &&
        fiber.dom != null
    ) {
        domParent.appendChild(fiber.dom)
    }else if (
        fiber.effectTag === "UPDATE" &&
        fiber.dom != null
    ) {
        updateDom(
          fiber.dom,
          fiber.alternate.props,
          fiber.props
        )
    }else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child) // 当前fiber的第一个子节点
    commitWork(fiber.sibling) // 当前fiber的兄弟节点
}


function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom)
    } else {
      commitDeletion(fiber.child, domParent)
    }
}

​let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

function useState(initial) {
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex]
    const hook = {
      state: oldHook ? oldHook.state : initial,
      queue: [],
    }

    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
          dom: currentRoot.dom,
          props: currentRoot.props,
          alternate: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }
  ​
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
  }
​
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  reconcileChildren(fiber, fiber.props.children)
}

// 调和算法(diif)
function reconcileChildren(wipFiber, elements) {
    let index = 0
    let oldFiber =
      wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null

    while (
      index < elements.length ||
      oldFiber != null
    ) {
        const element = elements[index]
        let newFiber = null

        // TODO compare oldFiber to element
        const sameType =
            oldFiber &&
            element &&
            element.type == oldFiber.type
​
        if (sameType) {
            // TODO update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            // TODO add this node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if (oldFiber && !sameType) {
            // TODO delete the oldFiber's node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }
  ​
      if (oldFiber) {

      }
    }
}
// 下一个任务单元
let nextUnitOfWork = null

// fiber tree
let wipRoot = null

// 上次提交的dom的fiber树
let currentRoot = null

// 被删除的fiber节点
let deletions = null;
​
function workLoop(deadline) {
  // 应该让出
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
   ​
  requestIdleCallback(workLoop)
}
​
// scheduler
// 浏览器空闲时间执行
requestIdleCallback(workLoop)


function performUnitOfWork(fiber) {

    const isFunctionComponent =
        fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }
    
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}


/**抛出一个对象 */
const Didact = {
    createElement,
    render,
    useState
}

/** @jsx Didact.createElement */
// const element = (
//     <div id="foo">
//         <a>bar</a>
//         <b />
//     </div>
// )
// const container = document.getElementById("root")
// Didact.render(element, container)