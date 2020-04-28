<template>
  <div class="container">
    <ul class="list-group list-group-flush">
      <li class="list-group-item mylist" v-for="o in options" :key="o.id">
        <div class="row">
          <div class="col-9">
            <input
              :disabled="o.disabled"
              type="checkbox"
              v-model="o.selected"
              @click="checkboxClicked(o)"
            />
            <label class="mylabel">{{ o.label }}</label>
          </div>
          <div class="col-3">
            <button class="btn btn-inline arrow" @click="moveUp(o)">
              <i class="fa fa-angle-up"></i>
            </button>
            <button class="btn btn-inline arrow" @click="moveDown(o)">
              <i class="fa fa-angle-down"></i>
            </button>
          </div>
        </div>
        <div class="childGrp">
          <ul v-if="o.children" class="list-group">
            <li
              class="list-group-item annoList"
              v-for="c in o.children"
              :key="c.id"
            >
              <div class="row">
                <div class="col-9">
                  <input
                    :disabled="c.disabled"
                    type="checkbox"
                    v-model="c.selected"
                    @click="checkboxClicked(c)"
                  />
                  <label class="mylabel">{{ c.label }}</label>
                </div>
                <div class="col-3">
                  <button class="btn btn-inline arrow" @click="moveUp(c)">
                    <i class="fa fa-angle-up"></i>
                  </button>
                  <button class="btn btn-inline arrow" @click="moveDown(c)">
                    <i class="fa fa-angle-down"></i>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'dataPanelEdit',
  props: ['columns'],
  computed: {
    options() {
      return this.columns
    },
  },
  data() {
    return {
      value: null,
    }
  },
  methods: {
    checkboxClicked(i) {
      if (i.checkAllChildren) {
        if (i.selected) {
          this.$emit('uncheck-all')
        } else {
          this.$emit('check-all')
        }
      }
      this.$emit('check-change')
    },
    moveUp(i) {
      this.$emit('move-up', i)
    },
    moveDown(i) {
      this.$emit('move-down', i)
    },
  },
}
</script>

<style scoped>
ul {
  list-style: none;
}
.childGrp {
  margin-left: 25px;
}
.myPretty {
  display: inline-flex;
  vertical-align: center;
  width: 300px;
  overflow: hidden;
  padding-left: 10px;
}
.mylabel {
  display: inline;
  margin-left: 10px;
  overflow: ellipsis;
}
.container {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  height: 380px;
  overflow: scroll;
}
.mylist {
  padding: 0.25rem 0.5rem !important;
}
.annoList {
  padding: 0.25rem 0.25rem !important;
}

li {
  margin-top: 0.25em;
}

label {
  font-weight: bold;
}
.arrow {
  outline: 0 !important;
  outline-offset: 0 !important;
  background-image: none !important;
  -webkit-box-shadow: none !important;
  box-shadow: none !important;
}

.container::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 5px;
}
.container::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgb(0, 0, 0, 0.5);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.897);
  width: 20px !important;
}
</style>
