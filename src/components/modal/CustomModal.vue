<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper" @click="closePopup()">
        <div class="modal-container" :style="modal_style">
          <div class="modal-header">
            <slot name="header">default header</slot>
          </div>

          <div class="modal-body align-middle">
            <slot name="body">default body</slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="$emit('close')">OK</button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'customModal',
  props: ['modalWidth', 'closeAnywhere'],
  mounted() {
    if (this.modalWidth) {
      this.modal_style = 'width: ' + this.modalWidth + 'px'
    }
  },
  components: {},
  data() {
    return {
      modal_style: 'width: 500px'
    }
  },
  computed: {},
  methods: {
    closePopup() {
      if (this.closeAnywhere) {
        this.$emit('close')
      }
    }
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 530px;
  max-height: 500px;
  margin: 0px auto;
  padding: 10px 10px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
  z-index: 9998;
}

.modal-header {
  padding: 5px;
  font-size: 0.9rem;
  font-weight: 800;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-footer {
  padding: 5px;
}

.modal-body {
  margin: 5px 0;
  padding: 5px;
}

.modal-default-button {
  float: right;
}

/*
     * The following styles are auto-applied to elements with
     * transition="modal" when their visibility is toggled
     * by Vue.js.
     *
     * You can easily play with the modal transition by editing
     * these styles.
     */

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>
